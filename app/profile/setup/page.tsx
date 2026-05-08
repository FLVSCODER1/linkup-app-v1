"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

function getSchoolFromEmail(email: string) {
  const lower = email.trim().toLowerCase();

  if (
    lower.endsWith("@students.ksd.org") ||
    lower.endsWith("@ksd.org")
  ) {
    return "Kennewick School District";
  }

  if (lower.endsWith("@pasco.k12.wa.us")) {
    return "Pasco School District";
  }

  if (lower.endsWith("@richland.k12.wa.us")) {
    return "Richland School District";
  }

  if (lower.endsWith("@ufl.edu")) {
    return "University of Florida Test";
  }

  if (lower.endsWith("@g.risd.org")) {
    return "University of Florida Test";
  }

  return "Unknown School";
}

const interestOptions = [
  "Sports",
  "Music",
  "Gaming",
  "Art",
  "STEM",
  "Volunteering",
  "Clubs",
  "Theater",
  "Business",
  "Fitness",
];

export default function ProfileSetupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [grade, setGrade] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      if (!firebaseUser.emailVerified) {
        router.push("/verify-email");
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().profileComplete) {
        router.push("/events");
        return;
      }

      if (userSnap.exists()) {
        const data = userSnap.data();

        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setGrade(data.grade || "");
        setInterests(data.interests || []);
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
      const school = getSchoolFromEmail(user.email);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        school,
        displayName: displayName.trim(),
        bio: bio.trim(),
        grade,
        interests,
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push("/events");
    } catch (error: any) {
      setMessage(error.message || "Failed to save profile.");
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
            Finish your profile so LinkUp can match you with events and people
            at your school.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
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
              <option value="college">College</option>
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
              {interestOptions.map((interest) => {
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