import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { hasAdminRole } from "@/app/lib/auth/admin.server";
import { getEmailDomain } from "@/app/lib/auth/school-directory";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUEST_ID_PATTERN = /^[a-f0-9]{64}$/;

function serializeDate(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

async function authorize(request: NextRequest) {
  const token = await verifyRequestToken(request);
  return token && (await hasAdminRole(token.uid, "school_directory_admin"))
    ? token
    : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getAdminDb()
      .collection("schoolRequests")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    const requests = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          domain: data.domain,
          schoolName: data.schoolName,
          city: data.city,
          state: data.state,
          districtName: data.districtName ?? null,
          officialWebsite: data.officialWebsite,
          calendarUrl: data.calendarUrl ?? null,
          requestCount:
            typeof data.requestCount === "number" ? data.requestCount : 1,
          requestedAt: serializeDate(data.requestedAt),
          lastRequestedAt: serializeDate(data.lastRequestedAt),
        };
      })
      .sort((left, right) => {
        const countDifference = right.requestCount - left.requestCount;
        return countDifference ||
          (left.requestedAt ?? "").localeCompare(right.requestedAt ?? "");
      });

    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("School request list failed:", error);
    return NextResponse.json(
      { error: "We couldn't load school requests." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await authorize(request);
    if (!reviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const decision = body.decision;
    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim().slice(0, 250)
        : "";

    if (
      !REQUEST_ID_PATTERN.test(id) ||
      (decision !== "approve" && decision !== "reject")
    ) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    const districtId =
      typeof body.districtId === "string" ? body.districtId.trim() : "";
    const districtName =
      typeof body.districtName === "string" ? body.districtName.trim() : "";
    const schoolId =
      typeof body.schoolId === "string" ? body.schoolId.trim() : "";
    const schoolName =
      typeof body.schoolName === "string" ? body.schoolName.trim() : "";
    const domainScope = body.domainScope === "district" ? "district" : "school";

    if (
      decision === "approve" &&
      (!ID_PATTERN.test(districtId) ||
        !ID_PATTERN.test(schoolId) ||
        !districtName ||
        districtName.length > 120 ||
        !schoolName ||
        schoolName.length > 120)
    ) {
      return NextResponse.json(
        { error: "Enter valid directory IDs and names before approval." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const requestRef = db.collection("schoolRequests").doc(id);

    await db.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef);
      const requestData = requestSnapshot.data();

      if (!requestSnapshot.exists || requestData?.status !== "pending") {
        throw new Error("School request is no longer pending.");
      }

      if (decision === "reject") {
        transaction.update(requestRef, {
          status: "rejected",
          reviewedAt: FieldValue.serverTimestamp(),
          reviewedBy: reviewer.uid,
          rejectionReason: rejectionReason || null,
        });
        return;
      }

      const domain = getEmailDomain(`student@${requestData.domain}`);
      if (!domain) throw new Error("School request has an invalid domain.");
      const mappedSchoolId = domainScope === "district" ? null : schoolId;

      const districtRef = db.collection("districts").doc(districtId);
      const schoolRef = db.collection("schools").doc(schoolId);
      const domainRef = db.collection("schoolDomains").doc(domain);
      const [districtSnapshot, schoolSnapshot, domainSnapshot] =
        await Promise.all([
          transaction.get(districtRef),
          transaction.get(schoolRef),
          transaction.get(domainRef),
        ]);

      if (
        schoolSnapshot.exists &&
        schoolSnapshot.data()?.districtId !== districtId
      ) {
        throw new Error("That school ID already belongs to another district.");
      }

      if (
        domainSnapshot.exists &&
        domainSnapshot.data()?.active === true &&
        (domainSnapshot.data()?.districtId !== districtId ||
          (domainSnapshot.data()?.schoolId ?? null) !== mappedSchoolId)
      ) {
        throw new Error("That domain is already assigned to another school.");
      }

      transaction.set(
        districtRef,
        {
          name: districtName,
          active: true,
          ...(districtSnapshot.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      transaction.set(
        schoolRef,
        {
          districtId,
          name: schoolName,
          city: requestData.city,
          state: requestData.state,
          officialWebsite: requestData.officialWebsite,
          active: true,
          ...(schoolSnapshot.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      transaction.set(
        domainRef,
        {
          districtId,
          schoolId: mappedSchoolId,
          active: true,
          ...(domainSnapshot.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      transaction.update(requestRef, {
        status: "approved",
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: reviewer.uid,
        rejectionReason: null,
        approvedDistrictId: districtId,
        approvedSchoolId: schoolId,
        approvedDomainScope: domainScope,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't review that school.";
    const knownConflict =
      message.includes("no longer pending") ||
      message.includes("already belongs") ||
      message.includes("already assigned");

    console.error("School request review failed:", error);
    return NextResponse.json(
      { error: knownConflict ? message : "We couldn't review that school." },
      { status: knownConflict ? 409 : 500 }
    );
  }
}
