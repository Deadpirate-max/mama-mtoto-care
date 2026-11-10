import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useRequireRole } from "@/lib/auth";
import { toast } from "sonner";
import { UserPlus, ShieldPlus, Building2, Loader2, Users, Phone, Shield } from "lucide-react";
import { API_BASE, getToken } from "@/lib/api";
import { Field, inputClass } from "@/components/Field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        toast.success("Invite sent successfully!");
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
        setNewFacCounty("");
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create facility");
    }
  };

  if (loading) {
    return (
      <AppShell title="Manage Staff">
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Manage Staff"
      subtitle={user?.role === "super_admin" ? "System Administration" : `${user?.facility} Staff`}
    >
      <div className="mx-auto max-w-3xl space-y-6 pb-20">
        {/* SUPER ADMIN: Create Facility */}
        {user?.role === "super_admin" && (
          <div className="card-surface">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Create Facility</h2>
            </div>
            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Facility Name" required>
                  <input
                    type="text"
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    placeholder="e.g. Kenyatta National Hospital"
                    className={inputClass()}
                    required
                  />
                </Field>
                <Field label="Code" required>
                  <input
                    type="text"
                    value={newFacCode}
                    onChange={(e) => setNewFacCode(e.target.value)}
                    placeholder="e.g. KNH-001"
                    className={inputClass()}
                    required
                  />
                </Field>
              </div>
              <Field label="County" required>
                <input
                  type="text"
                  value={newFacCounty}
                  onChange={(e) => setNewFacCounty(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className={inputClass()}
                  required
                />
              </Field>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90"
              >
                Create Facility
              </button>
            </form>
          </div>
        )}

        {/* SUPER ADMIN: Create Facility Admin */}
        {user?.role === "super_admin" && (
          <div className="card-surface">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldPlus className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Create Facility Admin
              </h2>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <Field label="Admin Name" required>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className={inputClass()}
                  required
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+254712345678"
                  className={inputClass()}
                  required
                />
              </Field>
              <Field label="Assign to Facility" required>
                <select
                  value={adminFacility}
                  onChange={(e) => setAdminFacility(e.target.value)}
                  className={inputClass()}
                  required
                >
                  <option value="">Select Facility...</option>
                  {facilities.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90"
              >
                Create Admin
              </button>
            </form>
          </div>
        )}

        {/* ALL ADMINS: Invite Nurse */}
        <div className="card-surface">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Invite a Nurse</h2>
          </div>
          <form onSubmit={handleInviteNurse} className="space-y-4">
            <Field label="Nurse Phone Number" required>
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+254712345678"
                className={inputClass()}
                required
              />
            </Field>
            {user?.role === "super_admin" && (
              <Field label="Assign to Facility" required>
                <select
                  value={inviteFacility}
                  onChange={(e) => setInviteFacility(e.target.value)}
                  className={inputClass()}
                  required
                >
                  <option value="">Select Facility...</option>
                  {facilities.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90"
            >
              Send Invite
            </button>
          </form>
        </div>

        {/* Active Staff List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
              <Users className="h-5 w-5 text-muted-foreground" />
              Active Staff
            </h2>
            <Badge tone="neutral">{nurses.length} total</Badge>
          </div>

          {nurses.length === 0 ? (
            <div className="card-surface flex flex-col items-center justify-center p-8 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">No staff found</p>
              <p className="text-xs text-muted-foreground">Invite a nurse to get started.</p>
            </div>
          ) : (
            <div className="card-surface overflow-hidden p-0">
              <ul className="divide-y divide-border">
                {nurses.map((nurse) => (
                  <li key={nurse.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-baby-soft text-sm font-bold text-baby">
                      {nurse.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">{nurse.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {nurse.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {nurse.role} · {nurse.facility_code}
                        </span>
                      </div>
                    </div>
                    <Badge tone={nurse.status === "active" ? "success" : "warning"}>
                      {nurse.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
