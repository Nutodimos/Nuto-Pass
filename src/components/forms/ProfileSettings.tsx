"use client";

import { updateProfile } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Droplets, Heart, Calendar, Lock, Camera } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ProfileData {
    name: string;
    surname: string;
    username: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    bloodType: string | null;
    sex: string | null;
    birthday: string | null;
    img: string | null;
}

interface ProfileSettingsProps {
    profile: ProfileData;
    role: string;
}

const ProfileSettings = ({ profile, role }: ProfileSettingsProps) => {
    const [state, formAction] = useFormState(updateProfile, {
        success: false,
        error: false,
    });

    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.img);

    useEffect(() => {
        if (state.success) {
            toast.success("Profile updated successfully!");
            router.refresh();
        } else if (state.error) {
            toast.error(
                (state as any).messages
                    ? (state as any).messages.join("\n")
                    : "Something went wrong!"
            );
        }
    }, [state, router]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toISOString().split("T")[0];
    };

    const getInitials = () => {
        return `${profile.name?.[0] || ""}${profile.surname?.[0] || ""}`.toUpperCase();
    };

    return (
        <form action={formAction} className="space-y-6">
            {/* Hidden field for avatar URL */}
            <input type="hidden" name="img" value={avatarUrl || ""} />

            {/* Avatar Section */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative group">
                    {/* Avatar Circle */}
                    <div
                        className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center"
                        style={{
                            borderColor: 'var(--border-primary)',
                            backgroundColor: avatarUrl ? 'transparent' : 'var(--bg-subtle)',
                        }}
                    >
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Profile"
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span
                                className="text-3xl font-bold"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {getInitials()}
                            </span>
                        )}
                    </div>

                    {/* Upload Overlay */}
                    <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET}
                        options={{
                            maxFiles: 1,
                            resourceType: "image",
                            sources: ["local", "camera"],
                            maxFileSize: 5 * 1024 * 1024,
                            cropping: true,
                            croppingAspectRatio: 1,
                            croppingShowDimensions: true,
                            folder: "nutopass/avatars",
                        }}
                        onSuccess={(result: any) => {
                            setAvatarUrl(result.info.secure_url);
                            toast.success("Photo uploaded! Click 'Save Changes' to apply.");
                        }}
                        onError={() => {
                            toast.error("Upload failed. Please try again.");
                        }}
                    >
                        {({ open }) => (
                            <button
                                type="button"
                                onClick={() => open()}
                                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200 cursor-pointer"
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                                    <Camera className="w-6 h-6 text-white" />
                                    <span className="text-white text-[10px] font-semibold">Change</span>
                                </div>
                            </button>
                        )}
                    </CldUploadWidget>
                </div>

                <div className="flex-1 text-center sm:text-left pt-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Profile Photo
                    </h3>
                    <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-tertiary)' }}>
                        JPG, PNG or WebP. Max 5MB. Hosted on Cloudinary.
                    </p>
                    <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET}
                        options={{
                            maxFiles: 1,
                            resourceType: "image",
                            sources: ["local", "camera"],
                            maxFileSize: 5 * 1024 * 1024,
                            cropping: true,
                            croppingAspectRatio: 1,
                            croppingShowDimensions: true,
                            folder: "nutopass/avatars",
                        }}
                        onSuccess={(result: any) => {
                            setAvatarUrl(result.info.secure_url);
                            toast.success("Photo uploaded! Click 'Save Changes' to apply.");
                        }}
                        onError={() => {
                            toast.error("Upload failed. Please try again.");
                        }}
                    >
                        {({ open }) => (
                            <button
                                type="button"
                                onClick={() => open()}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-nutoSlate/10"
                                style={{
                                    borderColor: 'var(--border-primary)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <Camera className="w-4 h-4 inline mr-2" />
                                Upload New Photo
                            </button>
                        )}
                    </CldUploadWidget>
                    {avatarUrl && avatarUrl !== profile.img && (
                        <span className="ml-2 text-xs text-nutoOrange font-medium">● Unsaved</span>
                    )}
                </div>
            </div>

            {/* Identity Section — Read-only */}
            <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Identity
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    These fields are managed by your institution and cannot be edited.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                            <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Full Name</label>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {profile.name} {profile.surname}
                        </p>
                    </div>

                    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                            <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                {role === "student" ? "Matric No." : "Staff ID"}
                            </label>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {profile.username}
                        </p>
                    </div>

                    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                            <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Role</label>
                        </div>
                        <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                            {role === "teacher" ? "Lecturer" : role}
                        </p>
                    </div>
                </div>
            </div>

            {/* Editable Section */}
            <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Contact & Personal
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Update your contact information and personal details.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Mail className="w-4 h-4 text-nutoSlate" />
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            defaultValue={profile.email || ""}
                            placeholder="your.email@example.com"
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Phone className="w-4 h-4 text-nutoSlate" />
                            Phone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            defaultValue={profile.phone || ""}
                            placeholder="+234 xxx xxx xxxx"
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin className="w-4 h-4 text-nutoSlate" />
                            Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            defaultValue={profile.address || ""}
                            placeholder="Your address"
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Droplets className="w-4 h-4 text-red-400" />
                            Blood Type
                        </label>
                        <select
                            name="bloodType"
                            defaultValue={profile.bloodType || ""}
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm cursor-pointer"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Heart className="w-4 h-4 text-pink-400" />
                            Sex
                        </label>
                        <select
                            name="sex"
                            defaultValue={profile.sex || ""}
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm cursor-pointer"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="">Select</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Calendar className="w-4 h-4 text-nutoOrange" />
                            Birthday
                        </label>
                        <input
                            type="date"
                            name="birthday"
                            defaultValue={formatDate(profile.birthday)}
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-nutoSlate focus:border-transparent transition-all text-sm"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-nutoSlate to-nutoSlateDark text-white p-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
                <User className="w-4 h-4" />
                Save Changes
            </button>
        </form>
    );
};

export default ProfileSettings;
