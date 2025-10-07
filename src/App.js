import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import './App.css';
import { auth, db, isFirebaseConfigured } from './firebase';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5',
    },
    secondary: {
      main: '#22d3ee',
    },
    background: {
      default: '#f5f7fb',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const formatDueDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ja-JP');
};

const createEmptyDialogValues = () => ({
  id: null,
  title: '',
  description: '',
  dueDate: '',
  completed: false,
});

function App() {
  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [dialogValues, setDialogValues] = useState(createEmptyDialogValues());

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authFormValues, setAuthFormValues] = useState({ email: '', password: '' });
  const [authMode, setAuthMode] = useState('signIn');

  const useFirestore = Boolean(isFirebaseConfigured && db);
  const isAuthEnabled = Boolean(useFirestore && auth);
  const isAuthFormValid =
    authFormValues.email.trim().length > 0 && authFormValues.password.length >= 6;

  useEffect(() => {
    if (!isAuthEnabled) {
      setUser(null);
      setAuthLoading(false);
      return undefined;
    }

    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setAuthError(null);
    });

    return unsubscribe;
  }, [isAuthEnabled]);

  const tasksCollection = useMemo(
    () => (useFirestore ? collection(db, 'tasks') : null),
    [useFirestore],
  );

  const tasksQuery = useMemo(() => {
    if (!tasksCollection || !user) {
      return null;
    }

    return query(tasksCollection, where('ownerId', '==', user.uid));
  }, [tasksCollection, user]);

  useEffect(() => {
    if (!tasksQuery) {
      if (useFirestore) {
        setTasks([]);
      }
      return undefined;
    }

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const nextTasks = snapshot.docs.map((document) => {
          const data = document.data();
          const createdAtMillis = (() => {
            if (typeof data.createdAtMillis === 'number') {
              return data.createdAtMillis;
            }
            if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
              return data.createdAt.toMillis();
            }
            return Date.now();
          })();

          return {
            id: document.id,
            title: data.title ?? '',
            description: data.description ?? '',
            dueDate: data.dueDate ?? '',
            completed: Boolean(data.completed),
            createdAt: createdAtMillis,
            ownerId: data.ownerId ?? null,
          };
        });

        setTasks(nextTasks);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to subscribe tasks', error);
      },
    );

    return unsubscribe;
  }, [tasksQuery, useFirestore]);

  const handleAuthInputChange = (field) => (event) => {
    setAuthFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
    setAuthError(null);
  };

  const resolveAuthErrorMessage = (error) => {
    if (!error || !error.code) {
      return 'サインインに失敗しました。時間をおいて再度お試しください。';
    }

    switch (error.code) {
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません。';
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています。管理者にお問い合わせください。';
      case 'auth/user-not-found':
        return '該当するユーザーが見つかりませんでした。新規登録をお試しください。';
      case 'auth/wrong-password':
        return 'パスワードが正しくありません。';
      case 'auth/email-already-in-use':
        return 'このメールアドレスはすでに登録されています。ログインをお試しください。';
      case 'auth/weak-password':
        return 'パスワードは6文字以上で設定してください。';
      default:
        return 'サインインに失敗しました。時間をおいて再度お試しください。';
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (!auth) {
      setAuthError('認証サービスに接続できません。環境設定を確認してください。');
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);

    const email = authFormValues.email.trim();
    const password = authFormValues.password;

    try {
      if (authMode === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setAuthFormValues({ email: '', password: '' });
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sign out', error);
    }
  };

  const createTask = async ({
    title,
    description = '',
    dueDate = '',
    completed = false,
  }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return false;
    }

    const sanitizedDescription =
      typeof description === 'string' ? description.trim() : '';
    const timestamp = Date.now();

    if (!useFirestore || !tasksCollection) {
      setTasks((prev) => [
        ...prev,
        {
          id: `${timestamp}-${Math.random().toString(16).slice(2)}`,
          title: trimmedTitle,
          description: sanitizedDescription,
          dueDate,
          completed,
          createdAt: timestamp,
          ownerId: 'local-user',
        },
      ]);
      return true;
    }

    if (!user) {
      if (isAuthEnabled) {
        setAuthError('タスクを操作するにはサインインが必要です。');
      }
      return false;
    }

    try {
      await addDoc(tasksCollection, {
        title: trimmedTitle,
        description: sanitizedDescription,
        dueDate,
        completed,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        createdAtMillis: timestamp,
      });
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add task', error);
      return false;
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) {
        return a.createdAt - b.createdAt;
      }
      return a.completed ? 1 : -1;
    });
  }, [tasks]);

  const incompleteCount = tasks.filter((task) => !task.completed).length;

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (isAuthEnabled && !user) {
      setAuthError('タスクを操作するにはサインインが必要です。');
      return;
    }
    const success = await createTask({ title: taskTitle });
    if (success) {
      setTaskTitle('');
    }
  };

  const handleToggleTask = (targetTask) => {
    if (!targetTask) {
      return Promise.resolve();
    }

    if (!useFirestore || !tasksCollection) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === targetTask.id
            ? { ...task, completed: !task.completed }
            : task,
        ),
      );
      return Promise.resolve();
    }

    if (!user) {
      if (isAuthEnabled) {
        setAuthError('タスクを操作するにはサインインが必要です。');
      }
      return Promise.resolve();
    }

    const taskRef = doc(db, 'tasks', targetTask.id);
    return updateDoc(taskRef, {
      completed: !targetTask.completed,
      updatedAt: serverTimestamp(),
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle task', error);
    });
  };

  const handleDeleteTask = (id) => {
    if (!id) {
      return Promise.resolve();
    }

    if (!useFirestore || !tasksCollection) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      return Promise.resolve();
    }

    if (!user) {
      if (isAuthEnabled) {
        setAuthError('タスクを操作するにはサインインが必要です。');
      }
      return Promise.resolve();
    }

    return deleteDoc(doc(db, 'tasks', id)).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to delete task', error);
    });
  };

  const handleOpenCreateDialog = () => {
    if (isAuthEnabled && !user) {
      setAuthError('タスクを操作するにはサインインが必要です。');
      return;
    }
    setDialogMode('create');
    setDialogValues(createEmptyDialogValues());
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (task) => {
    if (isAuthEnabled && !user) {
      setAuthError('タスクを操作するにはサインインが必要です。');
      return;
    }

    setDialogMode('edit');
    setDialogValues({
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      dueDate: task.dueDate ?? '',
      completed: task.completed,
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setDialogValues(createEmptyDialogValues());
  };

  const handleDialogFieldChange = (field) => (event) => {
    const value = field === 'completed' ? event.target.checked : event.target.value;
    setDialogValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDialogSubmit = async (event) => {
    event.preventDefault();

    if (dialogMode === 'create') {
      const success = await createTask({
        title: dialogValues.title,
        description: dialogValues.description,
        dueDate: dialogValues.dueDate,
        completed: dialogValues.completed,
      });
      if (success) {
        handleDialogClose();
      }
      return;
    }

    const trimmedTitle = dialogValues.title.trim();
    if (!trimmedTitle || !dialogValues.id) {
      return;
    }

    const sanitizedDescription =
      typeof dialogValues.description === 'string'
        ? dialogValues.description.trim()
        : '';

    if (!useFirestore || !tasksCollection) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === dialogValues.id
            ? {
                ...task,
                title: trimmedTitle,
                description: sanitizedDescription,
                dueDate: dialogValues.dueDate,
                completed: dialogValues.completed,
              }
            : task,
        ),
      );
      handleDialogClose();
      return;
    }

    if (!user) {
      if (isAuthEnabled) {
        setAuthError('タスクを操作するにはサインインが必要です。');
      }
      return;
    }

    const taskRef = doc(db, 'tasks', dialogValues.id);
    try {
      await updateDoc(taskRef, {
        title: trimmedTitle,
        description: sanitizedDescription,
        dueDate: dialogValues.dueDate,
        completed: dialogValues.completed,
        updatedAt: serverTimestamp(),
      });
      handleDialogClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update task', error);
    }
  };

  const handleDialogDelete = async () => {
    if (!dialogValues.id) {
      return;
    }

    await handleDeleteTask(dialogValues.id);
    handleDialogClose();
  };

  if (isAuthEnabled && authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          className="App"
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)',
            py: { xs: 6, md: 10 },
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, sm: 4 },
                backdropFilter: 'blur(12px)',
                borderRadius: 5,
                mx: 'auto',
                textAlign: 'center',
              }}
            >
              <Stack spacing={2} alignItems="center">
                <CircularProgress color="primary" />
                <Typography variant="subtitle1" color="text.secondary">
                  サインイン状態を確認しています...
                </Typography>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  const shouldRenderAuthForm = isAuthEnabled && !user;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="App"
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)',
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth={shouldRenderAuthForm ? 'sm' : 'md'}>
          {shouldRenderAuthForm ? (
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, sm: 4 },
                backdropFilter: 'blur(12px)',
                borderRadius: 5,
                mx: 'auto',
                maxWidth: 480,
              }}
            >
              <Stack spacing={3}>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h5">
                    {authMode === 'signIn' ? 'サインイン' : '新規登録'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {authMode === 'signIn'
                      ? 'メールアドレスとパスワードを入力してサインインしてください。'
                      : '初めてご利用の方はメールアドレスとパスワードでアカウントを作成できます。'}
                  </Typography>
                </Stack>
                {authError && (
                  <Alert severity="error" onClose={() => setAuthError(null)}>
                    {authError}
                  </Alert>
                )}
                <Stack component="form" spacing={2} onSubmit={handleAuthSubmit}>
                  <TextField
                    label="メールアドレス"
                    type="email"
                    value={authFormValues.email}
                    onChange={handleAuthInputChange('email')}
                    required
                    fullWidth
                    autoComplete="email"
                  />
                  <TextField
                    label="パスワード"
                    type="password"
                    value={authFormValues.password}
                    onChange={handleAuthInputChange('password')}
                    required
                    fullWidth
                    autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'}
                    helperText="6文字以上で入力してください"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!isAuthFormValid || authSubmitting}
                    startIcon={authSubmitting ? <CircularProgress size={20} /> : undefined}
                  >
                    {authMode === 'signIn' ? 'サインイン' : '登録する'}
                  </Button>
                </Stack>
                <Button type="button" onClick={toggleAuthMode}>
                  {authMode === 'signIn'
                    ? 'アカウントをお持ちでない方はこちら'
                    : 'すでにアカウントをお持ちの方はこちら'}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, sm: 4 },
                backdropFilter: 'blur(12px)',
                borderRadius: 5,
                maxWidth: 720,
                mx: 'auto',
                width: '100%',
              }}
            >
              <Stack spacing={3}>
                {isAuthEnabled && user && (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Box>
                      <Typography variant="h6">ようこそ</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Button variant="outlined" onClick={handleSignOut}>
                      サインアウト
                    </Button>
                  </Stack>
                )}
                {authError && isAuthEnabled && (
                  <Alert severity="warning" onClose={() => setAuthError(null)}>
                    {authError}
                  </Alert>
                )}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  component="form"
                  onSubmit={handleAddTask}
                  alignItems={{ sm: 'flex-end' }}
                >
                  <TextField
                    label="新しいタスク"
                    placeholder="例: レポートを提出する"
                    variant="outlined"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    fullWidth
                    autoFocus
                    disabled={isAuthEnabled && !user}
                  />
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{ px: 4, minWidth: 120, minHeight: 56, whiteSpace: 'nowrap' }}
                      disabled={!taskTitle.trim() || (isAuthEnabled && !user)}
                      fullWidth
                    >
                      追加
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      size="large"
                      sx={{ px: 4, minWidth: 120, minHeight: 56 }}
                      onClick={handleOpenCreateDialog}
                      disabled={isAuthEnabled && !user}
                      fullWidth
                    >
                      ＋
                    </Button>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    残り
                  </Typography>
                  <Chip
                    label={`${incompleteCount} 件`}
                    color={incompleteCount > 0 ? 'primary' : 'default'}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    / 合計 {tasks.length} 件
                  </Typography>
                </Stack>

                <Divider />

                {tasks.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderStyle: 'dashed',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body1">
                      まだタスクがありません。最初のタスクを追加しましょう。
                    </Typography>
                  </Paper>
                ) : (
                  <List disablePadding>
                    {sortedTasks.map((task) => (
                      <ListItem
                        key={task.id}
                        sx={{
                          mb: 1.5,
                          pl: 1.5,
                          pr: 6,
                          borderRadius: 2,
                          bgcolor: task.completed
                            ? 'action.hover'
                            : 'background.paper',
                          transition: 'background-color 0.2s ease',
                          alignItems: 'center',
                        }}
                        secondaryAction={
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ minWidth: 200, justifyContent: 'flex-end' }}
                          >
                            {task.dueDate ? (
                              <Chip
                                label={formatDueDate(task.dueDate)}
                                size="small"
                                color={task.completed ? 'default' : 'secondary'}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                期限なし
                              </Typography>
                            )}
                            <IconButton
                              edge="end"
                              onClick={() => handleOpenEditDialog(task)}
                              aria-label={`${task.title} を編集`}
                              disabled={isAuthEnabled && !user}
                            >
                              <EditOutlinedIcon />
                            </IconButton>
                          </Stack>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Checkbox
                            edge="start"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
                            inputProps={{
                              'aria-label': `${task.title} を完了にする`,
                            }}
                            disabled={isAuthEnabled && !user}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                textDecoration: task.completed
                                  ? 'line-through'
                                  : 'none',
                                color: task.completed
                                  ? 'text.disabled'
                                  : 'text.primary',
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            task.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ whiteSpace: 'pre-line', mt: 0.5 }}
                              >
                                {task.description}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            </Paper>
          )}
        </Container>
      </Box>

      {(!isAuthEnabled || user) && (
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            component: 'form',
            onSubmit: handleDialogSubmit,
          }}
        >
          <DialogTitle>
            {dialogMode === 'create' ? 'タスクを追加' : 'タスクを編集'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} mt={1}>
              <TextField
                label="タイトル"
                value={dialogValues.title}
                onChange={handleDialogFieldChange('title')}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="詳細"
                value={dialogValues.description}
                onChange={handleDialogFieldChange('description')}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="期限"
                type="date"
                value={dialogValues.dueDate}
                onChange={handleDialogFieldChange('dueDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dialogValues.completed}
                    onChange={handleDialogFieldChange('completed')}
                  />
                }
                label="完了済みにする"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            {dialogMode === 'edit' && (
              <Button
                type="button"
                color="error"
                onClick={handleDialogDelete}
                startIcon={<DeleteOutlineIcon />}
              >
                削除
              </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button type="button" onClick={handleDialogClose}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained">
              {dialogMode === 'create' ? '追加' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </ThemeProvider>
  );
}

export default App;
