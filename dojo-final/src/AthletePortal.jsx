import React, { useState, useEffect } from "react";
import { ScreenHome, ScreenLogin, ScreenAlreadyMember, ScreenRegister, ScreenChangePassword } from "./AthleteHome.jsx";
import AthleteDashboard from "./AthleteDashboard.jsx";

export default function AthletePortal({ session, supabase }) {
  const [screen, setScreen] = useState("home");
  const [athlete, setAthlete] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [news, setNews] = useState([]);
  const [exams, setExams] = useState([]);
  const [resources, setResources] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => { if (session) loadAthleteData(session.user.id); }, [session]);

  async function loadAthleteData(userId) {
    const { data } = await supabase.from("athletes").select("*").eq("user_id", userId).single();
    if (data) {
      setAthlete(data);
      setScreen("dashboard");
      const [p, n, e, fam, r] = await Promise.all([
        supabase.from("payments").select("*").eq("athlete_id", data.id).order("created_at", { ascending: false }),
        supabase.from("news").select("*").order("published_at", { ascending: false }),
        supabase.from("event_participants").select("*, events(*)").eq("athlete_id", data.id),
        supabase.from("athletes").select("*").eq("parent_athlete_id", data.id),
        supabase.from("resources").select("*").order("created_at", { ascending: false }),
      ]);
      setPayments(p.data || []);
      setNews(n.data || []);
      setExams(e.data || []);
      setFamilyMembers(fam.data || []);
      setResources(r.data || []);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAthlete(null); setFamilyMembers([]); setScreen("home");
  }

  if (mustChangePassword) return <ScreenChangePassword supabase={supabase} setMustChangePassword={setMustChangePassword} />;
  if (screen === "home") return <ScreenHome setScreen={setScreen} mounted={mounted} />;
  if (screen === "login") return <ScreenLogin supabase={supabase} setScreen={setScreen} />;
  if (screen === "already-member") return <ScreenAlreadyMember supabase={supabase} setScreen={setScreen} setMustChangePassword={setMustChangePassword} />;
  if (screen === "register") return <ScreenRegister supabase={supabase} setScreen={setScreen} />;
  if (screen === "dashboard" && athlete) return (
    <AthleteDashboard
      athlete={athlete} setAthlete={setAthlete}
      familyMembers={familyMembers} setFamilyMembers={setFamilyMembers}
      payments={payments} news={news} exams={exams} resources={resources}
      supabase={supabase} handleLogout={handleLogout}
    />
  );
  return null;
}
