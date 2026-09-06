'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Mail, 
  UserX, 
  UserCheck, 
  Building2, 
  Calendar, 
  AlertTriangle,
  RefreshCw,
  Edit2,
  Lock,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { normalizeRole, getRoleMeta, useAuth } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { 
  useEmployees, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee 
} from '@/hooks/use-dealflow';
import { EmployeeUser } from '@/types/dealflow';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/providers/query-provider';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; dept: string }> = [
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive', dept: 'Sales Operations' },
  { value: 'SALES_MANAGER', label: 'Sales Manager', dept: 'Sales Governance' },
  { value: 'FINANCE_OFFICER', label: 'Finance Controller / Officer', dept: 'Finance & Risk Management' },
  { value: 'ADMIN', label: 'System Administrator', dept: 'Executive Governance' },
];

export default function EmployeesPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const currentRole = normalizeRole(user?.role);
  const roleMeta = getRoleMeta(currentRole);

  const { data: employees = [], isLoading, isError, refetch } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUser | null>(null);

  // Form States
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('SALES_EXECUTIVE');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newCompany, setNewCompany] = useState('DealFlow360 Internal');

  // Action feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || 
                            (statusFilter === 'ACTIVE' && emp.active) || 
                            (statusFilter === 'INACTIVE' && !emp.active);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const activeCount = employees.filter(e => e.active).length;
    const salesCount = employees.filter(e => e.role === 'SALES_EXECUTIVE' || e.role === 'SALES_MANAGER').length;
    const financeCount = employees.filter(e => e.role === 'FINANCE_OFFICER').length;
    const adminCount = employees.filter(e => e.role === 'ADMIN').length;
    return { total, activeCount, salesCount, financeCount, adminCount };
  }, [employees]);

  // Reset Add Form
  const resetAddForm = () => {
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewRole('SALES_EXECUTIVE');
    setNewPassword('Password123!');
    setNewCompany('DealFlow360 Internal');
  };

  // Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newEmail) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    try {
      await createEmployeeMutation.mutateAsync({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim(),
        role: normalizeRole(newRole),
        password: newPassword,
        companyName: newCompany.trim() || undefined,
      });

      toast({
        title: 'Employee Added Successfully',
        description: `${newFirstName} ${newLastName} (${newRole}) has been provisioned.`,
        type: 'success',
      });
      setIsAddModalOpen(false);
      resetAddForm();
    } catch (err: unknown) {
      toast({
        title: 'Failed to Add Employee',
        description: (err instanceof Error ? err.message : '') || 'An error occurred while creating employee account.',
        type: 'error',
      });
    }
  };

  const handleEditOpen = (emp: EmployeeUser) => {
    setSelectedEmployee(emp);
    setNewFirstName(emp.firstName);
    setNewLastName(emp.lastName);
    setNewRole(normalizeRole(emp.role) as UserRole);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployee.id,
        payload: {
          role: normalizeRole(newRole),
        },
      });

      // If updating current logged-in user's account, refresh active session role immediately
      if (selectedEmployee.email.toLowerCase() === user?.email.toLowerCase() || selectedEmployee.id === user?.id) {
        await refreshUser();
      }

      toast({
        title: 'Employee Role Updated',
        description: `Updated system role for ${selectedEmployee.firstName} ${selectedEmployee.lastName}.`,
        type: 'success',
      });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        description: (err instanceof Error ? err.message : '') || 'Failed to update employee role.',
        type: 'error',
      });
    }
  };

  const handleDeactivateOpen = (emp: EmployeeUser) => {
    setSelectedEmployee(emp);
    setIsDeactivateModalOpen(true);
  };

  const handleToggleActiveStatus = async () => {
    if (!selectedEmployee) return;
    const isCurrentlyActive = selectedEmployee.active;

    try {
      if (isCurrentlyActive) {
        // Soft delete (deactivate)
        await deleteEmployeeMutation.mutateAsync(selectedEmployee.id);
        toast({
          title: 'Account Deactivated',
          description: `${selectedEmployee.firstName} ${selectedEmployee.lastName} has been set to inactive. Access disabled.`,
          type: 'success',
        });
      } else {
        // Reactivate via update
        await updateEmployeeMutation.mutateAsync({
          id: selectedEmployee.id,
          payload: {
            active: true,
          },
        });
        toast({
          title: 'Account Reactivated',
          description: `${selectedEmployee.firstName} ${selectedEmployee.lastName}'s access has been restored.`,
          type: 'success',
        });
      }
      setIsDeactivateModalOpen(false);
      setSelectedEmployee(null);
    } catch (err: unknown) {
      toast({
        title: 'Status Change Failed',
        description: (err instanceof Error ? err.message : '') || 'Failed to change account status.',
        type: 'error',
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to Clipboard', description: text, type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Department', 'Created At'];
    const rows = filteredEmployees.map(e => [
      e.id,
      `"${e.firstName}"`,
      `"${e.lastName}"`,
      `"${e.email}"`,
      e.role,
      e.active ? 'Active' : 'Inactive',
      `"${e.department || ''}"`,
      e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dealflow360-employees-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Employee Accounts & Identity Directory
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              Live Governance API
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage enterprise team access, system roles, department assignments, and security permissions connected to Neon DB backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportCSV} 
            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </Button>
          <Button 
            size="sm" 
            onClick={() => { resetAddForm(); setIsAddModalOpen(true); }}
            className="gap-2 bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Workforce</span>
              <Users className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{stats.activeCount} active</span> accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sales Operations</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                {stats.salesCount}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.salesCount}</div>
            <p className="mt-1 text-xs text-slate-500">Execs & Sales Managers</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Finance & Risk</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-50 text-xs font-bold text-purple-700">
                {stats.financeCount}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.financeCount}</div>
            <p className="mt-1 text-xs text-slate-500">Discount Governance Officers</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Admins</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                {stats.adminCount}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.adminCount}</div>
            <p className="mt-1 text-xs text-slate-500">Full System Control</p>
          </CardContent>
        </Card>

        <Card className="border border-teal-100 bg-teal-50/50 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-800 uppercase tracking-wider">Role Security</span>
              <Lock className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-sm font-semibold text-teal-950">Your Role: {roleMeta.label}</div>
            <p className="mt-1 text-xs text-teal-700 truncate">{user?.email}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Filter */}
              <div className="w-48">
                <Select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>

              {/* Status Filter Pills */}
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xs transition-colors ${
                    statusFilter === 'ALL' 
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xs transition-colors ${
                    statusFilter === 'ACTIVE' 
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({stats.activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-xs transition-colors ${
                    statusFilter === 'INACTIVE' 
                      ? 'bg-white text-rose-700 shadow-2xs font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inactive ({stats.total - stats.activeCount})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Employee Table */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Staff Directory ({filteredEmployees.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Real-time workforce records synchronized with Neon DB database
              </CardDescription>
            </div>
            {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Reset Filters
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableLoadingSkeleton rows={5} />
            </div>
          ) : isError ? (
            <div className="p-8">
              <ErrorState
                title="Failed to Load Employee Directory"
                message="Unable to fetch staff records from backend API. Please check server connection."
                onRetry={() => refetch()}
              />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No Employee Accounts Found"
                description={
                  searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? "No staff members matched your current search or filter criteria."
                    : "No employee accounts exist in the database yet."
                }
                actionLabel={searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? "Clear Filters" : "Add First Employee"}
                onAction={() => {
                  if (searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') {
                    setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL');
                  } else {
                    resetAddForm(); setIsAddModalOpen(true);
                  }
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[280px]">Employee & Contact</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map(emp => {
                    const meta = getRoleMeta(emp.role);
                    const isSelf = user?.email?.toLowerCase() === emp.email.toLowerCase();

                    return (
                      <TableRow key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Employee Name & Email */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-2xs ${
                              emp.active ? 'bg-gradient-to-br from-teal-500 to-slate-700' : 'bg-slate-400'
                            }`}>
                              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 text-sm truncate">
                                  {emp.firstName} {emp.lastName}
                                </span>
                                {isSelf && (
                                  <span className="inline-flex items-center rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{emp.email}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(emp.email, `email-${emp.id}`)}
                                  className="ml-1 text-slate-400 hover:text-slate-600"
                                  title="Copy Email"
                                >
                                  {copiedId === `email-${emp.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{emp.department || 'Operations'}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {emp.active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              Inactive / Disabled
                            </span>
                          )}
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOpen(emp)}
                              className="h-8 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateOpen(emp)}
                              disabled={isSelf}
                              className={`h-8 px-2.5 text-xs ${
                                emp.active 
                                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' 
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {emp.active ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                  Reactivate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD EMPLOYEE MODAL */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      >
        <DialogHeader>
          <DialogTitle>Provision New Employee Account</DialogTitle>
          <DialogDescription>
            Creates a real user record in Neon database. The user will be able to sign in immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">First Name *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Alex"
                value={newFirstName}
                onChange={e => setNewFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Last Name *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Rivera"
                value={newLastName}
                onChange={e => setNewLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Corporate Email Address *</label>
            <Input
              type="email"
              required
              placeholder="alex.rivera@dealflow360.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Assign System Role *</label>
            <Select
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <p className="text-[11px] text-slate-500">
              {getRoleMeta(newRole).description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Initial Password *</label>
              <Input
                type="text"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Company / Division</label>
              <Input
                type="text"
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Security Governance Note:</span> New accounts inherit permissions immediately upon creation. Ensure correct role placement for discount authorization limits.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEmployeeMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createEmployeeMutation.isPending ? 'Provisioning Account...' : 'Provision Employee'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT EMPLOYEE MODAL */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={open => { setIsEditModalOpen(open); if (!open) setSelectedEmployee(null); }}
      >
        <DialogHeader>
          <DialogTitle>Edit Employee Account</DialogTitle>
          <DialogDescription>
            Update identity details for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">First Name (Read-only)</label>
              <Input
                type="text"
                disabled
                value={newFirstName}
                className="bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Last Name (Read-only)</label>
              <Input
                type="text"
                disabled
                value={newLastName}
                className="bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address (Read-only)</label>
            <Input
              type="email"
              disabled
              value={selectedEmployee?.email || ''}
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">System Role</label>
            <Select
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsEditModalOpen(false); setSelectedEmployee(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEmployeeMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {updateEmployeeMutation.isPending ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* DEACTIVATE / REACTIVATE CONFIRMATION DIALOG */}
      <Dialog
        open={isDeactivateModalOpen}
        onOpenChange={open => { setIsDeactivateModalOpen(open); if (!open) setSelectedEmployee(null); }}
      >
        <DialogHeader>
          <DialogTitle>
            {selectedEmployee?.active ? "Deactivate Employee Access?" : "Reactivate Employee Access?"}
          </DialogTitle>
          <DialogDescription>
            {selectedEmployee?.active
              ? `Deactivating ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} will disable their login access and flag their account as inactive in the backend database.`
              : `Reactivating ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} will restore their login access and permissions.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className={`rounded-md p-3 text-xs border ${
            selectedEmployee?.active 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Audit Record Notice:</span> Employee accounts are soft-deleted in Neon database to preserve quote approval logs and deal historical trails.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsDeactivateModalOpen(false); setSelectedEmployee(null); }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleToggleActiveStatus}
              disabled={deleteEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              className={selectedEmployee?.active ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            >
              {selectedEmployee?.active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
