"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "react-toastify";
import { KeyRound, Lock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const SecuritySettings = () => {
    const { user, isLoaded } = useUser();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Some users might have signed in with Google/Microsoft and not have a password set up via Clerk yet.
    // We check if they have the 'password' factor. If they don't, we can show a friendly message.
    const hasPasswordProvider = user?.primaryEmailAddressId !== null &&
        user?.emailAddresses.length !== 0;
    // Note: Clerk provides a more nuanced way to check if a user has a password, 
    // but generally if they are allowed on this page, they can set one.
    // We'll let the user.updatePassword handle specific provider conflicts if they arise.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (!user) {
            setError("User session not found.");
            return;
        }

        setIsLoading(true);

        try {
            await user.updatePassword({
                currentPassword,
                newPassword,
                signOutOfOtherSessions: true,
            });

            setSuccess(true);
            toast.success("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error(err);
            const msg = err.errors?.[0]?.message || err.errors?.[0]?.longMessage || err.message || "An unexpected error occurred.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-CPENavy" />
            </div>
        );
    }

    return (
        <div className="max-w-xl">
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Change Password
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Update your password to keep your account secure.
                </p>
            </div>

            {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-green-800 text-sm">Password secured</p>
                        <p className="text-sm text-green-600 mt-1">Your password has been changed successfully. You have been signed out of all other devices.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <Lock className="w-4 h-4 text-CPENavy" />
                        Current Password
                    </label>
                    <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-CPENavy focus:border-transparent transition-all text-sm"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <KeyRound className="w-4 h-4 text-CPEGold" />
                        New Password
                    </label>
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-CPENavy focus:border-transparent transition-all text-sm"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                        }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Must be at least 8 characters long.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <Lock className="w-4 h-4 text-CPESlate" />
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-CPENavy focus:border-transparent transition-all text-sm"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-CPENavy to-CPENavyDark text-white p-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 mt-6 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <KeyRound className="w-4 h-4" />
                            Update Password
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default SecuritySettings;
