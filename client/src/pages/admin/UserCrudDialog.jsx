import React, { useEffect, useState } from 'react';
import { createAdminOperationRequestId } from './adminMutation.js';
import { Alert, ConfirmDialog, Field, inputClass } from './ui.jsx';

const emptyForm = { username: '', email: '', password: '', role: 'user', reason: '', confirmationUsername: '' };

export default function UserCrudDialog({
  mode,
  user,
  adminUsername,
  canAssignRoles,
  language = 'vi',
  request,
  onClose,
  onComplete,
}) {
  const en = language === 'en';
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      ...emptyForm,
      username: user?.username || '',
      email: user?.email || '',
      role: 'user',
    });
    setError('');
  }, [mode, user]);

  if (!mode) return null;
  const deleting = mode === 'delete';
  const creating = mode === 'create';
  const title = creating
    ? (en ? 'Create user' : 'Tạo người dùng')
    : deleting
      ? (en ? `Delete ${user?.username}` : `Xóa ${user?.username}`)
      : (en ? `Edit ${user?.username}` : `Sửa ${user?.username}`);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const requestId = createAdminOperationRequestId();
    const endpoint = creating ? '/api/admin/users' : `/api/admin/users/${user._id}`;
    const options = deleting
      ? {
          method: 'DELETE',
          body: JSON.stringify({ expectedVersion: user.__v, reason: form.reason, requestId, confirmation: { username: form.confirmationUsername.trim() } }),
        }
      : creating
        ? {
            method: 'POST',
            body: JSON.stringify({ username: form.username, email: form.email, password: form.password, role: form.role, reason: form.reason, requestId }),
          }
        : {
            method: 'PATCH',
            body: JSON.stringify({ username: form.username, email: form.email, expectedVersion: user.__v, reason: form.reason, requestId }),
          };
    const response = await request(endpoint, options);
    setSubmitting(false);
    if (!response.ok) {
      setError(response.data?.error?.message || response.data?.message || response.error || (en ? 'The operation failed.' : 'Thao tác thất bại.'));
      return;
    }
    onComplete();
  };

  const invalid = !form.reason.trim()
    || (!deleting && (!form.username.trim() || !form.email.trim()))
    || (creating && form.password.length < 10)
    || (deleting && form.confirmationUsername.trim() !== adminUsername);

  return (
    <ConfirmDialog
      open
      title={title}
      description={deleting
        ? (en ? 'The account will be disabled and retained for historical references.' : 'Tài khoản sẽ bị vô hiệu hóa và vẫn được giữ cho dữ liệu lịch sử.')
        : (en ? 'All changes are audited.' : 'Mọi thay đổi đều được ghi audit.')}
      confirmLabel={submitting ? (en ? 'Saving…' : 'Đang lưu…') : (deleting ? (en ? 'Soft delete' : 'Xóa mềm') : (en ? 'Save' : 'Lưu'))}
      tone={deleting ? 'danger' : 'primary'}
      onConfirm={submit}
      onClose={onClose}
      confirmDisabled={submitting || invalid}
    >
      <div className="grid gap-3">
        {error && <Alert tone="danger">{error}</Alert>}
        {!deleting && (
          <>
            <Field label="Username"><input className={inputClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          </>
        )}
        {creating && (
          <>
            <Field label={en ? 'Temporary password' : 'Mật khẩu tạm thời'}><input className={inputClass} type="password" minLength="10" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></Field>
            {canAssignRoles && <Field label={en ? 'Role' : 'Vai trò'}><select className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="user">User</option><option value="admin">Admin</option><option value="super_admin">Super admin</option></select></Field>}
          </>
        )}
        <Field label={en ? 'Audit reason' : 'Lý do ghi audit'}><input className={inputClass} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
        {deleting && <Field label={`${en ? 'Confirm with your username' : 'Xác nhận bằng username của bạn'}: ${adminUsername}`}><input className={inputClass} value={form.confirmationUsername} onChange={(event) => setForm({ ...form, confirmationUsername: event.target.value })} autoComplete="off" /></Field>}
      </div>
    </ConfirmDialog>
  );
}
