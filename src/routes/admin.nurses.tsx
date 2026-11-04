import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useRequireRole } from "@/lib/auth";
import { toast } from "sonner";
import { UserPlus, ShieldPlus, Building2 } from "lucide-react";
import { API_BASE, getToken } from "@/lib/api";

export const Route = createFileRoute("/admin/nurses")({
  component: ManageNursesPage,
});

function ManageNursesPage() {
  const { user } = useRequireRole(["facility_admin", "super_admin"]);

  const [nurses, setNurses] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteFacility, setInviteFacility] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminFacility, setAdminFacility] = useState("");

  const [newFacName, setNewFacName] = useState("");
  const [newFacCode, setNewFacCode] = useState("");
  const [newFacCounty, setNewFacCounty] = useState("");

  const fetchData = async () => {
    try {
      const token = getToken();

      // Fetch Facilities for dropdowns
      const facRes = await fetch(`${API_BASE}/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const facJson = await facRes.json();
      if (facJson.success) setFacilities(facJson.data);

      // Fetch Nurses
      const url =
        user?.role === "super_admin"
          ? `${API_BASE}/nurses/facility/all`
          : `${API_BASE}/nurses/facility/${user?.facility}`;
      const nurseRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const nurseJson = await nurseRes.json();
      if (nurseJson.success) setNurses(nurseJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleInviteNurse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 👇 FIXED: Wrapped in braces and used explicit return
    if (user?.role === "super_admin" && !inviteFacility) {
      toast.error("Please select a facility");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/nurses/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ phone: invitePhone, facilityCode: inviteFacility }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Invite sent!");
        setInvitePhone("");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to send invite");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 👇 FIXED: Wrapped in braces and used explicit return
    if (!adminFacility) {
      toast.error("Please select a facility");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/nurses/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: adminName,
          phone: adminPhone,
          facilityCode: adminFacility,
          role: "facility_admin",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Admin created! Default PIN: 1234");
        setAdminName("");
        setAdminPhone("");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create admin");
    }
  };

  const handleCreateFacility = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/facilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newFacName, code: newFacCode, county: newFacCounty }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Facility created!");
        setNewFacName("");
        setNewFacCode("");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create facility");
    }
  };

  if (loading)
    return (
      <AppShell title="Manage Staff">
        <div>Loading...</div>
      </AppShell>
    );

  return (
    <AppShell
      title="Manage Staff"
      subtitle={user?.role === "super_admin" ? "System Administration" : `${user?.facility} Staff`}
    >
      <div className="space-y-6 pb-20">
        {/* SUPER ADMIN: Create Facility */}
        {user?.role === "super_admin" && (
          <div className="rounded-2xl bg-indigo-50 p-5 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-lg text-indigo-900">Create Facility</h2>
            </div>
            <form onSubmit={handleCreateFacility} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="Facility Name"
                  className="flex-1 rounded-xl border border-indigo-200 px-4 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  value={newFacCode}
                  onChange={(e) => setNewFacCode(e.target.value)}
                  placeholder="Code (e.g. KCH-001)"
                  className="w-32 rounded-xl border border-indigo-200 px-4 py-2 text-sm"
                  required
                />
              </div>
              <input
                type="text"
                value={newFacCounty}
                onChange={(e) => setNewFacCounty(e.target.value)}
                placeholder="County"
                className="w-full rounded-xl border border-indigo-200 px-4 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Create Facility
              </button>
            </form>
          </div>
        )}

        {/* SUPER ADMIN: Create Facility Admin */}
        {user?.role === "super_admin" && (
          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <ShieldPlus className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Create Facility Admin</h2>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Admin Name"
                className="w-full rounded-xl border border-input px-4 py-2 text-sm"
                required
              />
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+254712345678"
                className="w-full rounded-xl border border-input px-4 py-2 text-sm"
                required
              />
              <select
                value={adminFacility}
                onChange={(e) => setAdminFacility(e.target.value)}
                className="w-full rounded-xl border border-input px-4 py-2 text-sm bg-white"
                required
              >
                <option value="">Select Facility...</option>
                {facilities.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Create Admin
              </button>
            </form>
          </div>
        )}

        {/* ALL ADMINS: Invite Nurse */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Invite a Nurse</h2>
          </div>
          <form onSubmit={handleInviteNurse} className="space-y-3">
            <input
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="+254712345678"
              className="w-full rounded-xl border border-input px-4 py-2 text-sm"
              required
            />
            {user?.role === "super_admin" && (
              <select
                value={inviteFacility}
                onChange={(e) => setInviteFacility(e.target.value)}
                className="w-full rounded-xl border border-input px-4 py-2 text-sm bg-white"
                required
              >
                <option value="">Select Facility...</option>
                {facilities.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Send Invite
            </button>
          </form>
        </div>

        {/* Active Staff List */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <h2 className="font-semibold text-lg mb-4">Active Staff</h2>
          <div className="space-y-3">
            {nurses.map((nurse) => (
              <div
                key={nurse.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border"
              >
                <div>
                  <p className="font-medium">{nurse.name}</p>
                  <p className="text-xs text-muted-foreground">{nurse.phone}</p>
                  <p className="text-[10px] text-primary/80 uppercase font-bold mt-1">
                    {nurse.role} · {nurse.facility_code}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${nurse.status === "active" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}
                >
                  {nurse.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
