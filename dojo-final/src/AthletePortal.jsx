import React, { useState, useEffect } from "react";
import { ScreenHome, ScreenLogin, ScreenAlreadyMember, ScreenRegister, ScreenChangePassword } from "./AthleteHome.jsx";
import AthleteDashboard from "./AthleteDashboard.jsx";

export default function AthletePortal({ session, supabase }) {
  const [screen, setScreen] = useState("home");
  const [allProfiles, setAllProfiles] = useState([]); // tutti i profili della famiglia
  const [activeProfile, setActiveProfile] = useState(null); // profilo attivo
  const [payments, setPayments] = useState([]);
  const [news, setNews] = useState([]);
  const [exams, setExams] = useState([]);
  const [resources, setResources] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isReferente, setIsReferente] = useState(false);

  // athlete e familyMembers derivati da allProfiles e activeProfile
  const athlete = activeProfile;
  const familyMembers = allProfiles.filter(p => p.id !== activeProfile?.id);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => { if (session) loadAthleteData(session.user.id); }, [session]);

  async function loadAthleteData(userId) {
    // 1. Cerca atleta per user_id
    const { data: mainAthlete } = await supabase.from("athletes").select("*").eq("user_id", userId).single();

    if (mainAthlete) {
      // 2. Carica tutti i profili della famiglia
      const rootId = mainAthlete.parent_athlete_id || mainAthlete.id;
      const { data: famData } = await supabase.from("athletes").select("*").eq("parent_athlete_id", rootId);
      const familiari = famData || [];

      // Profili: titolare + familiari
      const profiles = [mainAthlete, ...familiari];
      setAllProfiles(profiles);
      setActiveProfile(mainAthlete);
      setScreen("dashboard");
      await loadProfileData(mainAthlete, profiles);

    } else {
      // 3. Cerca per referente_email (genitori non praticanti)
      const { data: sessionData } = await supabase.auth.getUser();
      const email = sessionData?.user?.email;
      if (!email) return;

      const { data: refAthletes } = await supabase.from("athletes").select("*").eq("referente_email", email);
      if (refAthletes && refAthletes.length > 0) {
        setAllProfiles(refAthletes);
        setActiveProfile(refAthletes[0]);
        setIsReferente(true);
        setScreen("dashboard");
        await loadProfileData(refAthletes[0], refAthletes);
      }
    }
  }

  async function loadProfileData(profile, profiles) {
    const allIds = profiles.map(p => p.id);
    const [p, n, e, r] = await Promise.all([
      supabase.from("payments").select("*, athletes(first_name, last_name, fiscal_code, is_minor, parent_name, parent_cf)").in("athlete_id", allIds).order("created_at", { ascending: false }),
      supabase.from("news").select("*").order("published_at", { ascending: false }),
      supabase.from("event_participants").select("*, events(*)").in("athlete_id", allIds),
      supabase.from("resources").select("*").order("created_at", { ascending: false }),
    ]);
    setPayments(p.data || []);
    setNews(n.data || []);
    setExams(e.data || []);
    setResources(r.data || []);
  }

  async function switchProfile(profile) {
    setActiveProfile(profile);
    // Ricarica eventi per il nuovo profilo attivo
    const { data: e } = await supabase.from("event_participants").select("*, events(*)").eq("athlete_id", profile.id);
    setExams(e || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAllProfiles([]); setActiveProfile(null); setScreen("home");
  }

  if (mustChangePassword) return <ScreenChangePassword supabase={supabase} setMustChangePassword={setMustChangePassword} />;
  if (screen === "home") return <ScreenHome setScreen={setScreen} mounted={mounted} />;
  if (screen === "login") return <ScreenLogin supabase={supabase} setScreen={setScreen} />;
  if (screen === "already-member") return <ScreenAlreadyMember supabase={supabase} setScreen={setScreen} setMustChangePassword={setMustChangePassword} />;
  if (screen === "register") return <ScreenRegister supabase={supabase} setScreen={setScreen} />;
  if (screen === "dashboard" && athlete) return (
    <AthleteDashboard
      athlete={athlete} setAthlete={p => setActiveProfile(p)}
      familyMembers={familyMembers} setFamilyMembers={() => {}}
      allProfiles={allProfiles} activeProfile={activeProfile} switchProfile={switchProfile} isReferente={isReferente}
      payments={payments} news={news} exams={exams} resources={resources}
      supabase={supabase} handleLogout={handleLogout}
    />
  );
  return null;
}
