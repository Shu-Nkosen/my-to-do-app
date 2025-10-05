import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import './App.css';

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

  const createTask = ({
    title,
    description = '',
    dueDate = '',
    completed = false,
  }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return false;
    }

    const timestamp = Date.now();
    const sanitizedDescription =
      typeof description === 'string' ? description.trim() : '';

    setTasks((prev) => [
      ...prev,
      {
        id: `${timestamp}-${Math.random().toString(16).slice(2)}`,
        title: trimmedTitle,
        description: sanitizedDescription,
        dueDate,
        completed,
        createdAt: timestamp,
      },
    ]);

    return true;
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

  const handleAddTask = (event) => {
    event.preventDefault();
    const success = createTask({ title: taskTitle });
    if (success) {
      setTaskTitle('');
    }
  };

  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setDialogValues(createEmptyDialogValues());
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (task) => {
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

  const handleDialogSubmit = (event) => {
    event.preventDefault();

    if (dialogMode === 'create') {
      const success = createTask({
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
    if (!trimmedTitle) {
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === dialogValues.id
          ? {
              ...task,
              title: trimmedTitle,
              description:
                typeof dialogValues.description === 'string'
                  ? dialogValues.description.trim()
                  : '',
              dueDate: dialogValues.dueDate,
              completed: dialogValues.completed,
            }
          : task,
      ),
    );

    handleDialogClose();
  };

  const handleDialogDelete = () => {
    if (!dialogValues.id) {
      return;
    }

    handleDeleteTask(dialogValues.id);
    handleDialogClose();
  };

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
        <Container maxWidth="md">
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
                    disabled={!taskTitle.trim()}
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
                          onChange={() => handleToggleTask(task.id)}
                          inputProps={{
                            'aria-label': `${task.title} を完了にする`,
                          }}
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
        </Container>
      </Box>

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
    </ThemeProvider>
  );
}

export default App;
