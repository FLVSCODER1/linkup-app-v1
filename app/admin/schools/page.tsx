"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BackButton from "../../components/ui/BackButton";
import { auth } from "../../lib/firebase";

interface District { id: string; name: string; active: boolean }
interface School { id: string; districtId: string; name: string; active: boolean }
interface Domain {
  domain: string;
  districtId: string;
  schoolId: string | null;
  active: boolean;
}

export default function SchoolDirectoryAdminPage() {
  const router = useRouter();
  const [districts, setDistricts] = useState<District[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolDistrictId, setSchoolDistrictId] = useState("");
  const [domain, setDomain] = useState("");
  const [domainDistrictId, setDomainDistrictId] = useState("");
  const [domainSchoolId, setDomainSchoolId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDirectory = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/school-directory", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as {
      districts?: District[];
      schools?: School[];
      domains?: Domain[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Access denied.");
    setDistricts(data.districts ?? []);
    setSchools(data.schools ?? []);
    setDomains(data.domains ?? []);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      try {
        await loadDirectory();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Access denied.");
      } finally {
        setLoading(false);
      }
    });
  }, [loadDirectory, router]);

  async function save(payload: Record<string, unknown>) {
    const user = auth.currentUser;
    if (!user) return;
    setMessage("");
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/school-directory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "Save failed.");
      return;
    }
    setMessage("Directory updated.");
    await loadDirectory();
  }

  const domainSchools = schools.filter(
    (school) => school.districtId === domainDistrictId && school.active
  );

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <BackButton href="/events" label="Events" />
        <h1 className="text-3xl font-bold">School directory</h1>
        <p className="mt-2 text-sm text-white/60">
          Add districts, schools, and approved email domains without deploying code.
        </p>

        {message && <p className="mt-5 rounded-xl bg-white/10 p-4 text-sm">{message}</p>}
        {loading ? <p className="mt-8 text-white/60">Loading directory...</p> : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-semibold">Add or update district</h2>
              <input className="mt-4 w-full rounded-xl bg-black p-3" placeholder="richardson-isd" value={districtId} onChange={(e) => setDistrictId(e.target.value)} />
              <input className="mt-3 w-full rounded-xl bg-black p-3" placeholder="Richardson Independent School District" value={districtName} onChange={(e) => setDistrictName(e.target.value)} />
              <button className="mt-3 w-full rounded-xl bg-white p-3 font-semibold text-black" onClick={() => save({ action: "upsertDistrict", id: districtId, name: districtName })}>Save district</button>
              <ul className="mt-5 space-y-2 text-sm text-white/60">{districts.map((item) => <li key={item.id}>{item.name} <span className="text-white/30">({item.id})</span></li>)}</ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-semibold">Add or update school</h2>
              <select className="mt-4 w-full rounded-xl bg-black p-3" value={schoolDistrictId} onChange={(e) => setSchoolDistrictId(e.target.value)}><option value="">Select district</option>{districts.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <input className="mt-3 w-full rounded-xl bg-black p-3" placeholder="richardson-high" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
              <input className="mt-3 w-full rounded-xl bg-black p-3" placeholder="Richardson High School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              <button className="mt-3 w-full rounded-xl bg-white p-3 font-semibold text-black" onClick={() => save({ action: "upsertSchool", id: schoolId, districtId: schoolDistrictId, name: schoolName })}>Save school</button>
              <ul className="mt-5 space-y-2 text-sm text-white/60">{schools.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-semibold">Add or update email domain</h2>
              <input className="mt-4 w-full rounded-xl bg-black p-3" placeholder="g.risd.org" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <select className="mt-3 w-full rounded-xl bg-black p-3" value={domainDistrictId} onChange={(e) => { setDomainDistrictId(e.target.value); setDomainSchoolId(""); }}><option value="">Select district</option>{districts.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <select className="mt-3 w-full rounded-xl bg-black p-3" value={domainSchoolId} onChange={(e) => setDomainSchoolId(e.target.value)}><option value="">Shared district domain</option>{domainSchools.map((item) => <option key={item.id} value={item.id}>{item.name} only</option>)}</select>
              <button className="mt-3 w-full rounded-xl bg-white p-3 font-semibold text-black" onClick={() => save({ action: "upsertDomain", domain, districtId: domainDistrictId, schoolId: domainSchoolId })}>Save domain</button>
              <ul className="mt-5 space-y-2 text-sm text-white/60">{domains.map((item) => <li key={item.domain}>{item.domain}</li>)}</ul>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
