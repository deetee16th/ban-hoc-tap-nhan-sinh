import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminSettings } from './components/admin/AdminSettings';
import { LoginModal } from './components/auth/LoginModal';
import { DailyCheckIn } from './components/checkin/DailyCheckIn';
import { WeeklyDashboard } from './components/dashboard/WeeklyDashboard';
import { InsightsSupport } from './components/insights/InsightsSupport';
import { DisplayControls } from './components/layout/DisplayControls';
import { MobileBottomNav, MobileHeader } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { Toast, ToastMessage } from './components/layout/Toast';
import { dataService } from './services/dataService';
import {
  DailyLog,
  GroupId,
  GroupPresentationNoteMap,
  Member,
  TabId,
  UiSettings,
  UserAccount,
  WeekConfig,
} from './types';
import { computeWeeklyDashboard } from './utils/analytics';
import {
  canUsePresentationMode,
  canViewIndividualDetails,
  getAllowedTabs,
  getAuthLevel,
  getLockedGroup,
} from './utils/auth';

const TAB_TITLES: Record<TabId, string> = {
  dashboard: 'Báo Cáo Tuần',
  checkin: 'Sổ Theo Dõi Ngày',
  insights: 'Điểm Sáng & Đồng Hành',
  admin: 'Quản Lý Lớp',
};

export function App() {
  const initialData = useMemo(() => dataService.loadAll(), []);

  const [members, setMembers] = useState<Member[]>(initialData.members);
  const [weeks, setWeeks] = useState<WeekConfig[]>(initialData.weeks);
  const [logs, setLogs] = useState<DailyLog[]>(initialData.logs);
  const [accounts, setAccounts] = useState<UserAccount[]>(initialData.accounts);
  const [uiSettings, setUiSettings] = useState<UiSettings>(
    initialData.uiSettings
  );
  const [groupNotes, setGroupNotes] = useState<GroupPresentationNoteMap>(
    initialData.groupNotes
  );

  const [currentAccountId, setCurrentAccountId] = useState<string | null>(() =>
    dataService.getLoggedInAccountId()
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const latest = initialData.weeks[initialData.weeks.length - 1];
    return latest ? latest.weekNumber : 1;
  });
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback(
    (text: string, tone: 'success' | 'info' = 'success') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), text, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3400);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const forceLogoutDueToPasswordChange = useCallback(() => {
    const activeSession = dataService.getAuthSession();
    if (!activeSession) return;
    dataService.setAuthSession(null);
    setCurrentAccountId(null);
    setIsPresentationMode(false);
    setActiveTab('dashboard');
    notify(
      'Mật khẩu tài khoản vừa được thay đổi. Vui lòng đăng nhập lại.',
      'info'
    );
  }, [notify]);

  const checkSessionValidity = useCallback(async () => {
    const activeSession = dataService.getAuthSession();
    if (!activeSession) return;

    const result = await dataService.verifySessionWithRemote();
    if (result.passwordChanged) {
      forceLogoutDueToPasswordChange();
    } else if (result.account) {
      setAccounts(dataService.getAccounts());
    }
  }, [forceLogoutDueToPasswordChange]);

  const applyDataset = useCallback(
    (dataset: ReturnType<typeof dataService.loadAll>) => {
      setMembers(dataset.members);
      setWeeks(dataset.weeks);
      setLogs(dataset.logs);
      setAccounts(dataset.accounts);
      setUiSettings(dataset.uiSettings);
      setGroupNotes(dataset.groupNotes);
      if (dataset.weeks.length > 0) {
        setSelectedWeek((prev) => {
          const exists = dataset.weeks.some((w) => w.weekNumber === prev);
          if (exists) return prev;
          return dataset.weeks[dataset.weeks.length - 1].weekNumber;
        });
      }

      const activeSession = dataService.getAuthSession();
      if (activeSession) {
        const matchedAccount = dataset.accounts.find(
          (a) =>
            a.username.toLowerCase() === activeSession.username.toLowerCase() ||
            a.id === activeSession.accountId
        );
        if (
          matchedAccount &&
          matchedAccount.password !== activeSession.password
        ) {
          forceLogoutDueToPasswordChange();
        }
      }
    },
    [forceLogoutDueToPasswordChange]
  );

  // Tự động đồng bộ từ Supabase, kiểm tra đối chiếu mật khẩu khi tải trang / quay lại tab / Realtime UPDATE
  useEffect(() => {
    let isMounted = true;

    void checkSessionValidity();

    if (dataService.isRemoteEnabled()) {
      void dataService.syncFromRemote().then((remoteDataset) => {
        if (isMounted && remoteDataset) {
          applyDataset(remoteDataset);
        }
      });
    }

    const unsubscribe = dataService.subscribeToRealtime(
      (updatedDataset) => {
        if (isMounted) {
          applyDataset(updatedDataset);
        }
      },
      (updatedAccount) => {
        if (!isMounted) return;
        const activeSession = dataService.getAuthSession();
        if (
          activeSession &&
          (updatedAccount.username.toLowerCase() ===
            activeSession.username.toLowerCase() ||
            updatedAccount.id === activeSession.accountId)
        ) {
          if (updatedAccount.password !== activeSession.password) {
            forceLogoutDueToPasswordChange();
            return;
          }
        }
        void checkSessionValidity();
      }
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkSessionValidity();
      }
    };

    const handleWindowFocus = () => {
      void checkSessionValidity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [applyDataset, checkSessionValidity, forceLogoutDueToPasswordChange]);

  // Đồng bộ tiêu đề tab trình duyệt theo tên ứng dụng Admin cấu hình
  useEffect(() => {
    document.title = uiSettings.appSubtitle
      ? `${uiSettings.appName} — ${uiSettings.appSubtitle}`
      : uiSettings.appName;
  }, [uiSettings.appName, uiSettings.appSubtitle]);

  const currentAccount = useMemo(() => {
    if (!currentAccountId) return null;
    return (
      accounts.find(
        (a) =>
          a.id === currentAccountId ||
          a.username.toLowerCase() === currentAccountId.toLowerCase()
      ) ?? null
    );
  }, [accounts, currentAccountId]);

  const authLevel = useMemo(
    () => getAuthLevel(currentAccount),
    [currentAccount]
  );
  const allowedTabs = useMemo(() => getAllowedTabs(authLevel), [authLevel]);
  const lockedGroup = useMemo(
    () => getLockedGroup(currentAccount),
    [currentAccount]
  );
  const canUsePresentation = useMemo(
    () => canUsePresentationMode(authLevel),
    [authLevel]
  );
  const canViewIndividuals = useMemo(
    () => canViewIndividualDetails(authLevel),
    [authLevel]
  );

  // Tự động đưa về Báo Cáo Tuần nếu tab hiện tại không nằm trong quyền truy cập
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [allowedTabs, activeTab]);

  // Tự động thoát chế độ trình chiếu nếu không còn quyền admin/banhoctap
  useEffect(() => {
    if (!canUsePresentation && isPresentationMode) {
      setIsPresentationMode(false);
    }
  }, [canUsePresentation, isPresentationMode]);

  // Thoát chế độ trình chiếu Zoom bằng phím Escape
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode]);

  const currentWeek = useMemo(
    () => weeks.find((w) => w.weekNumber === selectedWeek) ?? weeks[0],
    [weeks, selectedWeek]
  );

  const sidebarSummary = useMemo(
    () =>
      computeWeeklyDashboard(
        members,
        logs,
        selectedWeek,
        currentWeek?.studyDates
      ),
    [members, logs, selectedWeek, currentWeek]
  );

  const dashboardGroupFilter = useMemo(() => {
    if (
      authLevel === 'group_officer' &&
      !uiSettings.allowGroupOfficerViewOtherGroups
    ) {
      return lockedGroup;
    }
    return null;
  }, [authLevel, uiSettings.allowGroupOfficerViewOtherGroups, lockedGroup]);

  const handleAuthenticate = (username: string, password: string) => {
    return dataService.authenticate(username, password);
  };

  const handleLoginSuccess = (account: UserAccount) => {
    setAccounts(dataService.getAccounts());
    dataService.setAuthSession(account);
    setCurrentAccountId(account.id);
    setIsLoginModalOpen(false);
    notify(`Xin chào ${account.displayName} (@${account.username})!`, 'success');
  };

  const handleLogout = () => {
    dataService.setAuthSession(null);
    setCurrentAccountId(null);
    setIsPresentationMode(false);
    setActiveTab('dashboard');
    notify('Đã đăng xuất về chế độ Học viên (Chế độ xem).', 'info');
  };

  const handleSelectTab = (tab: TabId) => {
    if (!allowedTabs.includes(tab)) {
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tab);
  };

  const handleOpenPresentation = () => {
    if (!canUsePresentation) return;
    setActiveTab('dashboard');
    setIsPresentationMode(true);
  };

  const handleUpsertLog = (nextLog: DailyLog) => {
    const updatedLogs = dataService.upsertLog(nextLog);
    setLogs(updatedLogs);
  };

  const handleUpsertLogsBatch = (batch: DailyLog[]) => {
    const updatedLogs = dataService.upsertLogsBatch(batch);
    setLogs(updatedLogs);
  };

  const handleSaveMember = (member: Member) => {
    const updatedMembers = dataService.saveMember(member);
    setMembers(updatedMembers);
  };

  const handleDeleteMember = (memberId: string) => {
    const updated = dataService.deleteMember(memberId);
    setMembers(updated.members);
    setLogs(updated.logs);
  };

  const handleSaveWeek = (week: WeekConfig) => {
    const updatedWeeks = dataService.saveWeek(week);
    setWeeks(updatedWeeks);
  };

  const handleUpdateAccountDetails = async (
    accountId: string,
    updates: { displayName: string; password: string }
  ) => {
    const sessionBefore = dataService.getAuthSession();
    const updatedAccounts = await dataService.updateAccountDetails(
      accountId,
      updates
    );
    setAccounts(updatedAccounts);

    if (sessionBefore) {
      const currentAccAfter = updatedAccounts.find(
        (a) =>
          a.username.toLowerCase() === sessionBefore.username.toLowerCase() ||
          a.id === sessionBefore.accountId
      );
      if (
        currentAccAfter &&
        currentAccAfter.password !== sessionBefore.password
      ) {
        forceLogoutDueToPasswordChange();
      }
    }
  };

  const handleSaveUiSettings = (settings: UiSettings) => {
    const saved = dataService.saveUiSettings(settings);
    setUiSettings(saved);
  };

  const handleSaveGroupNote = (
    weekNumber: number,
    group: GroupId,
    note: string
  ) => {
    const updated = dataService.saveGroupNote(weekNumber, group, note);
    setGroupNotes(updated);
  };

  if (isPresentationMode && canUsePresentation) {
    return (
      <div className="min-h-screen bg-canvas text-slate-900">
        <WeeklyDashboard
          members={members}
          logs={logs}
          weeks={weeks}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          uiSettings={uiSettings}
          groupNotes={groupNotes}
          onSaveGroupNote={handleSaveGroupNote}
          canUsePresentation={canUsePresentation}
          canViewIndividualDetails={canViewIndividuals}
          lockedGroup={lockedGroup}
          visibleGroupFilter={dashboardGroupFilter}
          isAdmin={authLevel === 'admin'}
          isPresentationMode={true}
          onTogglePresentation={setIsPresentationMode}
          onNotify={notify}
        />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        allowedTabs={allowedTabs}
        currentAccount={currentAccount}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        uiSettings={uiSettings}
        canUsePresentation={canUsePresentation}
        currentWeek={currentWeek}
        totalMembers={sidebarSummary.totalMembers}
        qualifiedCount={sidebarSummary.qualifiedCount}
        qualifiedRate={sidebarSummary.qualifiedRate}
        onOpenPresentation={handleOpenPresentation}
      />

      <MobileHeader
        currentWeek={currentWeek}
        currentAccount={currentAccount}
        uiSettings={uiSettings}
        canUsePresentation={canUsePresentation}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenPresentation={handleOpenPresentation}
      />

      <div className="lg:pl-72">
        {/* Desktop Header: Tiêu đề trang & Bộ điều khiển Sáng/Tối + Cỡ chữ A/A+ */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-slate-200 px-8 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-bold text-slate-900 truncate">
              {TAB_TITLES[activeTab]}
            </span>
            {currentWeek && (
              <>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="text-sm font-medium text-slate-500 truncate tabular-nums">
                  {currentWeek.label}
                  {currentWeek.topic ? ` — ${currentWeek.topic}` : ''}
                </span>
              </>
            )}
          </div>

          <DisplayControls />
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:py-8">
          {activeTab === 'dashboard' && (
            <WeeklyDashboard
              members={members}
              logs={logs}
              weeks={weeks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              uiSettings={uiSettings}
              groupNotes={groupNotes}
              onSaveGroupNote={handleSaveGroupNote}
              canUsePresentation={canUsePresentation}
              canViewIndividualDetails={canViewIndividuals}
              lockedGroup={lockedGroup}
              visibleGroupFilter={dashboardGroupFilter}
              isAdmin={authLevel === 'admin'}
              isPresentationMode={false}
              onTogglePresentation={setIsPresentationMode}
              onNotify={notify}
            />
          )}

          {activeTab === 'checkin' && allowedTabs.includes('checkin') && (
            <DailyCheckIn
              members={members}
              logs={logs}
              weeks={weeks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              lockedGroup={lockedGroup}
              currentAccount={currentAccount}
              groupNames={uiSettings.groupNames}
              onUpsertLog={handleUpsertLog}
              onUpsertLogsBatch={handleUpsertLogsBatch}
              onNotify={notify}
            />
          )}

          {activeTab === 'insights' && allowedTabs.includes('insights') && (
            <InsightsSupport
              members={members}
              logs={logs}
              weeks={weeks}
              selectedWeek={selectedWeek}
              groupNames={uiSettings.groupNames}
              onSelectWeek={setSelectedWeek}
              onNotify={notify}
            />
          )}

          {activeTab === 'admin' && allowedTabs.includes('admin') && (
            <AdminSettings
              members={members}
              weeks={weeks}
              logs={logs}
              accounts={accounts}
              uiSettings={uiSettings}
              selectedWeek={selectedWeek}
              isAdmin={authLevel === 'admin'}
              onSelectWeek={setSelectedWeek}
              onSaveMember={handleSaveMember}
              onDeleteMember={handleDeleteMember}
              onSaveWeek={handleSaveWeek}
              onUpdateAccountDetails={handleUpdateAccountDetails}
              onSaveUiSettings={handleSaveUiSettings}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        allowedTabs={allowedTabs}
        onSelectTab={handleSelectTab}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthenticate={handleAuthenticate}
        onLoginSuccess={handleLoginSuccess}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default App;
