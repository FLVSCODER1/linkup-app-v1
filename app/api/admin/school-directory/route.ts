import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { hasAdminRole } from "@/app/lib/auth/admin.server";
import { getEmailDomain } from "@/app/lib/auth/school-directory";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

    const db = getAdminDb();
    const [districtsSnapshot, schoolsSnapshot, domainsSnapshot] =
      await Promise.all([
        db.collection("districts").limit(250).get(),
        db.collection("schools").limit(1000).get(),
        db.collection("schoolDomains").limit(500).get(),
      ]);

    const districts = districtsSnapshot.docs
      .map((document) => ({
        id: document.id,
        name: document.data().name,
        active: document.data().active === true,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const schools = schoolsSnapshot.docs
      .map((document) => ({
        id: document.id,
        districtId: document.data().districtId,
        name: document.data().name,
        active: document.data().active === true,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const domains = domainsSnapshot.docs
      .map((document) => ({
        domain: document.id,
        districtId: document.data().districtId,
        schoolId: document.data().schoolId ?? null,
        active: document.data().active === true,
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain));

    return NextResponse.json({ districts, schools, domains });
  } catch (error) {
    console.error("School directory list failed:", error);
    return NextResponse.json(
      { error: "We couldn't load the school directory." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    const active = body.active !== false;
    const db = getAdminDb();

    if (action === "upsertDistrict") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";

      if (!ID_PATTERN.test(id) || !name || name.length > 120) {
        return NextResponse.json(
          { error: "Use a lowercase district ID and a valid name." },
          { status: 400 }
        );
      }

      await db.collection("districts").doc(id).set(
        { name, active, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } else if (action === "upsertSchool") {
      const id = typeof body.id === "string" ? body.id.trim() : "";
      const districtId =
        typeof body.districtId === "string" ? body.districtId.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const district = await db.collection("districts").doc(districtId).get();

      if (
        !ID_PATTERN.test(id) ||
        !district.exists ||
        district.data()?.active !== true ||
        !name ||
        name.length > 120
      ) {
        return NextResponse.json(
          { error: "Choose an active district and valid school details." },
          { status: 400 }
        );
      }

      await db.collection("schools").doc(id).set(
        { districtId, name, active, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } else if (action === "upsertDomain") {
      const rawDomain =
        typeof body.domain === "string" ? body.domain.trim().toLowerCase() : "";
      const domain = getEmailDomain(`student@${rawDomain}`);
      const districtId =
        typeof body.districtId === "string" ? body.districtId.trim() : "";
      const schoolId =
        typeof body.schoolId === "string" && body.schoolId.trim()
          ? body.schoolId.trim()
          : null;
      const district = await db.collection("districts").doc(districtId).get();
      const school = schoolId
        ? await db.collection("schools").doc(schoolId).get()
        : null;

      if (
        !domain ||
        !district.exists ||
        district.data()?.active !== true ||
        (school &&
          (!school.exists ||
            school.data()?.active !== true ||
            school.data()?.districtId !== districtId))
      ) {
        return NextResponse.json(
          { error: "Choose an active district and a valid optional school." },
          { status: 400 }
        );
      }

      await db.collection("schoolDomains").doc(domain).set(
        {
          districtId,
          schoolId,
          active,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("School directory update failed:", error);
    return NextResponse.json(
      { error: "We couldn't update the school directory." },
      { status: 500 }
    );
  }
}
