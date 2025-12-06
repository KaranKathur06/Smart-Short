'use client';

import Sidebar from '@/components/Sidebar';
import { Loader, User, Mail, Image as ImageIcon, Lock, Shield, Bell, Trash2, Wallet, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [upiId, setUpiId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWithdrawal, setNotifyWithdrawal] = useState(true);
  const [notifyAnalytics, setNotifyAnalytics] = useState(true);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let active = true;
    supabase
      .auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        const session = data.session;
        if (!session) {
          router.replace('/auth/login');
          return;
        }
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setEmail(session.user.email ?? '');
        const metaLast = (session.user as any).last_sign_in_at as string | null;
        setLastSignIn(metaLast || null);

        try {
          const { data: profile } = await (supabase as any)
            .from('users')
            .select('full_name, username, avatar_url, upi_id, paypal_email, bank_details, notify_email, notify_withdrawal, notify_analytics')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name || '');
            setUsername(profile.username || '');
            setAvatarUrl(profile.avatar_url || '');
            setUpiId(profile.upi_id || '');
            setPaypalEmail(profile.paypal_email || '');
            setBankDetails(profile.bank_details || '');
            setNotifyEmail(profile.notify_email ?? true);
            setNotifyWithdrawal(profile.notify_withdrawal ?? true);
            setNotifyAnalytics(profile.notify_analytics ?? true);
          }
        } finally {
          if (active) {
            setSessionLoading(false);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setSessionLoading(false);
        router.replace('/auth/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          full_name: fullName || null,
          username: username || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', userId);

      if (error) {
        setProfileError(error.message || 'Failed to update profile');
        toast.error('Failed to update profile');
        return;
      }

      toast.success('Profile updated ✓');
    } catch {
      setProfileError('Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePayout = async () => {
    if (!userId) return;
    setPayoutSaving(true);
    setPayoutError('');
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          upi_id: upiId || null,
          paypal_email: paypalEmail || null,
          bank_details: bankDetails || null,
        })
        .eq('id', userId);

      if (error) {
        setPayoutError(error.message || 'Failed to update payout settings');
        toast.error('Failed to update payout settings');
        return;
      }

      toast.success('Payout settings updated ✓');
    } catch {
      setPayoutError('Failed to update payout settings');
      toast.error('Failed to update payout settings');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!userId) return;
    setNotifySaving(true);
    setNotifyError('');
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          notify_email: notifyEmail,
          notify_withdrawal: notifyWithdrawal,
          notify_analytics: notifyAnalytics,
        })
        .eq('id', userId);

      if (error) {
        setNotifyError(error.message || 'Failed to update notifications');
        toast.error('Failed to update notifications');
        return;
      }

      toast.success('Notification preferences updated ✓');
    } catch {
      setNotifyError('Failed to update notifications');
      toast.error('Failed to update notifications');
    } finally {
      setNotifySaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordNew || passwordNew.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew });
      if (error) {
        setPasswordError(error.message || 'Failed to update password.');
        toast.error('Failed to update password.');
        return;
      }

      setPasswordNew('');
      setPasswordConfirm('');
      toast.success('Password updated successfully');
    } catch {
      setPasswordError('Failed to update password.');
      toast.error('Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLogoutAllLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Logged out from all devices');
      router.replace('/auth/login');
    } catch {
      toast.error('Failed to logout from all sessions');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = body?.error || 'Failed to delete account';
        setDeleteError(message);
        toast.error(message);
        return;
      }

      toast.success('Account deleted successfully');
      await supabase.auth.signOut({ scope: 'global' });
      router.replace('/auth/login');
    } catch {
      setDeleteError('Failed to delete account');
      toast.error('Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <Loader className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-slate-200">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
              <p className="text-slate-400 text-sm">Manage your profile, security, payouts, and notifications</p>
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-300">Signed in as</p>
              <p className="text-slate-200 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {email}
              </p>
              {lastSignIn && (
                <p className="mt-1">Last active: {new Date(lastSignIn).toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr,1.4fr] gap-6 items-start">
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-400" />
                      Profile
                    </h2>
                    <p className="text-xs text-slate-400">Update your basic account information</p>
                  </div>
                </div>
                {profileError && (
                  <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {profileError}
                  </div>
                )}
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Email</p>
                    <p className="text-slate-100 text-sm break-all">{email}</p>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                      placeholder="Unique username"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="input-field"
                      placeholder="https://..."
                    />
                    {avatarUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt="Avatar preview"
                          className="h-10 w-10 rounded-full object-cover border border-slate-700"
                        />
                        <span className="text-xs text-slate-500">Preview</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {profileSaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      Security
                    </h2>
                    <p className="text-xs text-slate-400">Change your password and manage sessions</p>
                  </div>
                </div>
                {passwordError && (
                  <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {passwordError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <p className="font-medium text-slate-200 text-sm">Change password</p>
                    <div>
                      <label className="block text-slate-300 mb-1">New password</label>
                      <input
                        type="password"
                        value={passwordNew}
                        onChange={(e) => setPasswordNew(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Confirm password</label>
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      className="btn-primary mt-2 flex items-center gap-2 px-4 py-2 text-sm"
                    >
                      {passwordSaving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Update password
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="font-medium text-slate-200 text-sm">Sessions</p>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <p className="font-medium mb-1">Current device</p>
                      <p className="text-slate-400 break-all">{email}</p>
                      {lastSignIn && (
                        <p className="text-slate-500 mt-1">Last active: {new Date(lastSignIn).toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutAllSessions}
                      disabled={logoutAllLoading}
                      className="btn-secondary mt-2 flex items-center gap-2 px-4 py-2 text-sm"
                    >
                      {logoutAllLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          Logout all sessions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-amber-400" />
                      Payout settings
                    </h2>
                    <p className="text-xs text-slate-400">Configure where you receive your earnings</p>
                  </div>
                </div>
                {payoutError && (
                  <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {payoutError}
                  </div>
                )}
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-slate-300 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="input-field"
                      placeholder="example@upi"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">PayPal email</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="input-field"
                      placeholder="you@paypal.com"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Bank details (optional)</label>
                    <textarea
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      className="input-field min-h-[80px] resize-none"
                      placeholder="Account holder, account number, IFSC, bank name"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePayout}
                    disabled={payoutSaving}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {payoutSaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Save payout settings
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-sky-400" />
                      Notifications
                    </h2>
                    <p className="text-xs text-slate-400">Choose what updates you want to receive</p>
                  </div>
                </div>
                {notifyError && (
                  <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {notifyError}
                  </div>
                )}
                <div className="space-y-3 text-sm">
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-slate-200">Email notifications</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-slate-200">Withdrawal updates</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                      checked={notifyWithdrawal}
                      onChange={(e) => setNotifyWithdrawal(e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-slate-200">Analytics and performance alerts</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-600 bg-slate-900"
                      checked={notifyAnalytics}
                      onChange={(e) => setNotifyAnalytics(e.target.checked)}
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={notifySaving}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {notifySaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Save preferences
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="card border-red-500/40 bg-gradient-to-br from-slate-950 via-slate-950 to-red-950/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      Danger Zone
                    </h2>
                    <p className="text-xs text-slate-400">Permanently delete your SmartShort account</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  This will remove your account, links, clicks, and wallet history. This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {deleteError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>

        {deleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="card max-w-md w-full">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Delete account
              </h2>
              <p className="text-sm text-slate-300 mb-4">
                Are you sure you want to delete your account? This will permanently remove your profile, links,
                clicks, earnings, and payout history. This action cannot be undone.
              </p>
              {deleteError && (
                <div className="mb-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setDeleteOpen(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {deleteLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
