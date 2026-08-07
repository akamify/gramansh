"use client";
import React, { useEffect, useState } from "react";
import { useAuth, useRequireAuth } from "@/app/context/AuthContext";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserAddresses,
  createUserAddress,
  updateUserAddress,
} from "@/app/lib/apiClient";
import type { UserAddress, UserAddressInput } from "@/app/lib/apiClient";
import AddressForm from "@/app/components/address/AddressForm";
import AddressModal from "@/app/components/address/AddressModal";
import AddressCard from "@/app/components/address/AddressCard";

import { ProfileSkeleton } from "@/app/components/Skeletons";

export default function ProfilePage() {
  const { user } = useAuth();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth("/user/auth");
  const [profile, setProfile] = useState({ name: "", email: user?.email || "", phone: "", gender: "" });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressForm, setAddressForm] = useState<UserAddressInput>({
    FullName: "",
    phone1: "",
    phone2: "",
    country: "India",
    state: "",
    city: "",
    district: "",
    pinCode: "",
    address: "",
    address_line2: "",
    addressType: "Home",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [profileData, addressesData] = await Promise.all([
          fetchUserProfile(),
          fetchUserAddresses(),
        ]);
        const raw = profileData as Record<string, unknown>;
        const profileRecord = ((raw.profile as Record<string, unknown>) || raw) as { name?: string; email?: string; phone?: string; gender?: string };
        console.log('Loaded profile data:', profileRecord);
        setProfile({
          name: profileRecord.name || "",
          email: profileRecord.email || user?.email || "",
          phone: profileRecord.phone || "",
          gender: profileRecord.gender || "",
        });
        setAddresses(addressesData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated, user?.email]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const openCreateAddress = () => {
    setEditingAddressId(null);
    setAddressError("");
    setAddressForm({
      FullName: profile.name || "",
      phone1: profile.phone || "",
      phone2: "",
      country: "India",
      state: "",
      city: "",
      district: "",
      pinCode: "",
      address: "",
      address_line2: "",
      addressType: "Home",
    });
    setShowAddressForm(true);
  };

  const openEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.address_id);
    setAddressError("");
    setAddressForm({
      FullName: addr.FullName || profile.name || "",
      phone1: addr.phone1 || profile.phone || "",
      phone2: addr.phone2 || "",
      country: addr.country || "India",
      state: addr.state || "",
      city: addr.city || "",
      district: addr.district || "",
      pinCode: addr.pinCode || "",
      address: addr.address || "",
      address_line2: addr.address_line2 || "",
      addressType: addr.addressType || "Home",
    });
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async () => {
    if (!addressForm.FullName || !addressForm.phone1 || !addressForm.address || !addressForm.city || !addressForm.pinCode) {
      setAddressError("Please fill required address fields.");
      return;
    }
    try {
      setIsAddressSaving(true);
      setAddressError("");
      if (editingAddressId) {
        const updated = await updateUserAddress(editingAddressId, addressForm);
        setAddresses((prev) => prev.map((addr) => (addr.address_id === editingAddressId ? updated : addr)));
      } else {
        const created = await createUserAddress(addressForm);
        setAddresses((prev) => [created, ...prev]);
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch {
      setAddressError("Failed to save address.");
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserProfile({
        name: profile.name,
        phone: profile.phone,
        gender: profile.gender,
      });
      setSaveSuccess(true);
      // Refresh profile data
      const raw = await fetchUserProfile() as Record<string, unknown>;
      const profileRecord = ((raw.profile as Record<string, unknown>) || raw) as { name?: string; email?: string; phone?: string; gender?: string };
      setProfile({
        name: profileRecord.name || "",
        email: profileRecord.email || user?.email || "",
        phone: profileRecord.phone || "",
        gender: profileRecord.gender || "",
      });
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) return <ProfileSkeleton />;
  if (!isAuthenticated) return null;


  return (
    <div className="space-y-16">
      {/* Personal Information Section */}
      <section className="bg-surface-container-low rounded-xl p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="font-headline text-3xl font-bold text-primary italic leading-tight">Account Details</h2>
              <p className="text-on-surface-variant text-sm mt-2">Manage your core identity and contact information.</p>
            </div>
            <div className="flex items-center gap-4">
              {saveSuccess && (
                <span className="text-secondary text-sm font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-on-primary px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Full Name</label>
              <div className="border-b border-outline-variant/40 focus-within:border-primary pb-2 transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 font-headline italic text-xl text-primary focus:ring-0 outline-none"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Email Address</label>
              <div className="border-b border-outline-variant/40 focus-within:border-primary pb-2 transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 font-headline italic text-xl text-primary focus:ring-0 outline-none"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Mobile Phone</label>
              <div className="border-b border-outline-variant/40 focus-within:border-primary pb-2 transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 font-headline italic text-xl text-primary focus:ring-0 outline-none"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 12345 67890"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Gender</label>
              <div className="border-b border-outline-variant/40 focus-within:border-primary pb-2 transition-colors">
                <select
                  className="w-full bg-transparent border-none p-0 font-headline italic text-xl text-primary focus:ring-0 outline-none appearance-none cursor-pointer"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: String(e.target.value) })}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>
            {/* Age removed per request */}
          </div>
        </div>
      </section>

      {/* Shipping Addresses Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-3xl font-bold text-primary italic">Saved Addresses</h2>
          <button
            type="button"
            onClick={openCreateAddress}
            className="flex items-center gap-2 border-[1.5px] border-secondary text-secondary px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary-container/10 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Add New
          </button>
        </div>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">location_off</span>
              <p className="text-on-surface-variant">No saved addresses yet.</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <AddressCard
                key={addr.address_id}
                address={addr}
                selected={false}
                onSelect={() => {}}
                onEdit={() => openEditAddress(addr)}
              />
            ))
          )}
        </div>
      </section>

      {showAddressForm && (
        <AddressModal
          title={editingAddressId ? "Edit Address" : "Add New Address"}
          onClose={() => {
            setShowAddressForm(false);
            setEditingAddressId(null);
            setAddressError("");
          }}
        >
            <AddressForm
              value={addressForm}
              onChange={setAddressForm}
              onSubmit={handleAddressSubmit}
              onCancel={() => {
                setShowAddressForm(false);
                setEditingAddressId(null);
                setAddressError("");
              }}
              submitLabel={editingAddressId ? "Update Address" : "Save Address"}
              busy={isAddressSaving}
              error={addressError}
            />
        </AddressModal>
      )}

      {/* Heritage Callout */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-primary text-on-primary rounded-xl overflow-hidden relative">
        <div className="md:col-span-1 h-64 md:h-full relative overflow-hidden bg-primary-container">
          <img
            alt="Artisan Texture"
            className="w-full h-full object-cover brightness-75 mix-blend-overlay"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNN_2lgdoWZlKZNGi_kTDHbXlBIwAWSLXAseJD1dygBnS_yJzyK7Cj6e-_Ic5TM6RrzZXXtMylfIbDLum3oO5bFxhhZx-gZ48zTrY1UyJ3VhJI0I7CoDvBFf0w6uemywyXbuCE86JLs5ZJqvg6buu07di-YIXg8-n34HxETSDXFvwXjDoo8RdVYQVKIX1rJIBsm_MF3Or3cVUig_3Zx1szzVU0MLvekz6tG_tlJue8TH5QblVo7_gUDCXaoDjBBEOLm6nVyc0iSxA"
          />
        </div>
        <div className="md:col-span-2 p-10 relative">
          <div className="absolute top-4 right-12 w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary flex items-center justify-center text-center p-4 border-4 border-primary z-20 shadow-lg rotate-12">
            <span className="font-headline italic text-xs md:text-sm font-bold leading-tight text-white uppercase">100% Traceable</span>
          </div>
          <h3 className="font-headline text-3xl italic mb-4 max-w-sm">Your Gold Standard Protection</h3>
          <p className="font-body text-on-primary/80 text-sm leading-relaxed max-w-md mb-8">
            At Gram Ansh, we protect your personal information with the same care we bring to our products. Your details are handled using secure, modern protection standards.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-secondary-container">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-primary">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-container">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-primary">Privacy Guaranteed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
