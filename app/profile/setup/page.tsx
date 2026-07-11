"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  PROFILE_INTERESTS,
  validateProfileSetupInput,
} from "../../lib/auth/profile-validation";
import type { SchoolDirectoryContext } from "../../lib/auth/school-directory";
import { hasVerifiedAccount } from "../../lib/auth/verification";

export default function ProfileSetupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [grade, setGrade] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolContext, setSchoolContext] =
    useState<SchoolDirectoryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      if (!(await hasVerifiedAccount(firebaseUser, true))) {
        router.push("/verify-email");
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (
        userSnap.exists() &&
        userSnap.data().profileComplete &&
        userSnap.data().district &&
        userSnap.data().school
      ) {
        router.push("/events");
        return;
      }

      if (userSnap.exists()) {
        const data = userSnap.data();

        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setGrade(data.grade || "");
        setInterests(data.interests || []);
        setSchoolId(data.schoolId || "");
      }

      if (!firebaseUser.email) {
        setMessage("Your account does not have an email address.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/school-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: firebaseUser.email }),
      });
      const directoryData = (await response.json()) as {
        context?: SchoolDirectoryContext;
        error?: string;
      };

      if (!response.ok || !directoryData.context) {
        setMessage(directoryData.error || "Your school is not supported yet.");
        setLoading(false);
        return;
      }

      setSchoolContext(directoryData.context);
      if (directoryData.context.schools.length === 1) {
        setSchoolId(directoryData.context.schools[0].id);
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  }

  async function handleSaveProfile() {
    if (!user || !user.email) return;

    if (!displayName.trim()) {
      setMessage("Please enter a display name.");
      return;
    }

    if (!grade.trim()) {
      setMessage("Please select your grade.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const validation = validateProfileSetupInput({
        displayName,
        bio,
        grade,
        interests,
        schoolId,
      });

      if (!validation.valid) {
        setMessage(validation.error);
        return;
      }

      const token = await user.getIdToken(true);
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validation.value),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error || "We couldn't save your profile.");
        return;
      }

      router.push("/events");
    } catch {
      setMessage("We couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading profile setup...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Set up your profile</h1>
          <p className="text-sm text-white/70">
            Finish your profile so LinkUp can recommend events and people
            at your school.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              School
            </label>
            <select
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value)}
              disabled={!schoolContext || schoolContext.schools.length === 1}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-70"
            >
              <option value="">Select your school</option>
              {schoolContext?.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            {schoolContext && (
              <p className="mt-2 text-xs text-white/50">
                {schoolContext.districtName}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should people call you?"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Grade
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              title="Select your grade"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/30"
            >
              <option value="">Select grade</option>
              <option value="9">9th grade</option>
              <option value="10">10th grade</option>
              <option value="11">11th grade</option>
              <option value="12">12th grade</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Say something short about yourself."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-white/80">
              Interests
            </label>

            <div className="flex flex-wrap gap-2">
              {PROFILE_INTERESTS.map((interest) => {
                const selected = interests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`
                      rounded-full
                      px-4
                      py-2
                      text-sm
                      font-medium
                      transition
                      ${
                        selected
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }
                    `}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {message && <p className="text-sm text-red-400">{message}</p>}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="
              w-full
              rounded-xl
              bg-white
              px-4
              py-3
              font-semibold
              text-black
              transition
              hover:scale-[1.02]
              active:scale-95
              disabled:opacity-50
            "
          >
            {saving ? "Saving..." : "Finish setup"}
          </button>
        </div>
      </div>
    </main>
  );
}
