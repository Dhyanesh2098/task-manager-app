import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
 XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

import getActivities from "../services/activityService";
import { uploadFile } from "../services/fileService";

const socket = io("http://localhost:5000");

const columns = ["Backlog", "To Do", "In Progress", "In Review", "Completed"];

const menuItems = [
  "Board",
  "Tasks",
  "Calendar",
  "Analytics",
  "Activity",
  "AI Assistant",
  "Notifications",
  "Focus",
  "Settings",
];

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  const [search, setSearch] = useState("");

  const [activeView, setActiveView] = useState("Board");

  const [showForm, setShowForm] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  const [darkMode, setDarkMode] = useState(true);

  const [timer, setTimer] = useState(25 * 60);

  const [running, setRunning] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Project",
    dueDate: "",
    status: "To Do",
    assignedTo: "",
    attachment: "",
  });

  const normalizeStatus = (status) =>
    status === "Pending" ? "To Do" : status || "To Do";

  const fetchTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const fetchActivities = async () => {
    const data = await getActivities();
    setActivities(data);
  };

  useEffect(() => {
    if (!user) navigate("/");

    fetchTasks();
    fetchActivities();

    socket.on("tasksUpdated", () => {
      fetchTasks();
      fetchActivities();
    });

    return () => socket.off("tasksUpdated");
  }, []);

  useEffect(() => {
    let interval;

    if (running && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }

    if (timer === 0) {
      setRunning(false);
      toast.success("Pomodoro session completed!");
    }

    return () => clearInterval(interval);
  }, [running, timer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateForm = () => {
    setEditingTask(null);

    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      category: "Project",
      dueDate: "",
      status: "To Do",
      assignedTo: "",
      attachment: "",
    });

    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);

    setFormData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "Medium",
      category: task.category || "Project",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      status: normalizeStatus(task.status),
      assignedTo: task.assignedTo || "",
      attachment: task.attachment || "",
    });

    setShowForm(true);
  };

  const submitTask = async (e) => {
    e.preventDefault();

    let fileData = null;

    if (selectedFile) {
      fileData = await uploadFile(selectedFile);
    }

    const finalData = {
      ...formData,
      attachment: fileData?.filePath || formData.attachment,
    };

    if (editingTask) {
      await updateTask(editingTask._id, finalData);
      toast.success("Task updated");
    } else {
      await createTask(finalData);
      toast.success("Task created");
    }

    socket.emit("taskChanged");

    setShowForm(false);

    setEditingTask(null);

    setSelectedFile(null);

    fetchTasks();

    fetchActivities();
  };

  const removeTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(id);

      toast.success("Task deleted");

      socket.emit("taskChanged");

      fetchTasks();

      fetchActivities();
    }
  };

  const changeStatus = async (task, status) => {
    await updateTask(task._id, { status });

    toast.success(`Moved to ${status}`);

    socket.emit("taskChanged");

    fetchTasks();

    fetchActivities();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    await updateTask(result.draggableId, {
      status: result.destination.droppableId,
    });

    toast.success("Task moved");

    socket.emit("taskChanged");

    fetchTasks();

    fetchActivities();
  };

 const exportPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, 210, 35, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text("Task Command Center Report", 20, 22);

  pdf.setTextColor(0, 0, 0);

  pdf.setFontSize(12);

  pdf.text(`Generated For: ${user?.name}`, 20, 50);
  pdf.text(`Email: ${user?.email}`, 20, 58);

  pdf.text(`Total Tasks: ${total}`, 20, 75);
  pdf.text(`Completed Tasks: ${completed}`, 20, 83);
  pdf.text(`High Priority Tasks: ${highPriority}`, 20, 91);
  pdf.text(`Overdue Tasks: ${overdue}`, 20, 99);
  pdf.text(`Productivity Score: ${productivity}%`, 20, 107);

  pdf.setDrawColor(100);
  pdf.line(20, 115, 190, 115);

  let y = 130;

  filteredTasks.forEach((task, index) => {
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(15, y - 8, 180, 48, 4, 4, "F");

    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);

    pdf.text(`${index + 1}. ${task.title}`, 22, y);

    pdf.setFontSize(11);

    pdf.text(
      `Description: ${task.description || "No description"}`,
      25,
      y + 8
    );

    pdf.text(
      `Status: ${normalizeStatus(task.status)}`,
      25,
      y + 16
    );

    pdf.text(
      `Priority: ${task.priority}`,
      25,
      y + 24
    );

    pdf.text(
      `Category: ${task.category || "General"}`,
      110,
      y + 16
    );

    pdf.text(
      `Assigned To: ${task.assignedTo || "Not assigned"}`,
      110,
      y + 24
    );

    pdf.text(
      `Due Date: ${
        task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "No due date"
      }`,
      25,
      y + 32
    );

    y += 58;
  });

  pdf.save("task-report.pdf");
};

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredTasks = tasks.filter((task) =>
    `${task.title} ${task.description} ${task.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const tasksByStatus = (status) =>
    filteredTasks.filter(
      (task) => normalizeStatus(task.status) === status
    );

  const total = filteredTasks.length;

  const completed = filteredTasks.filter(
    (task) => normalizeStatus(task.status) === "Completed"
  ).length;

  const highPriority = filteredTasks.filter(
    (task) => task.priority === "High"
  ).length;

  const overdue = filteredTasks.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      normalizeStatus(task.status) !== "Completed"
  ).length;

  const productivity =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const chartData = columns.map((column) => ({
    name: column,
    value: tasksByStatus(column).length,
  }));

  const priorityData = ["Low", "Medium", "High"].map((priority) => ({
    name: priority,
    count: filteredTasks.filter(
      (task) => task.priority === priority
    ).length,
  }));

  const aiSuggestions = [];

  if (overdue > 0) {
    aiSuggestions.push(
      "Complete overdue tasks first to improve delivery score."
    );
  }

  if (highPriority > 2) {
    aiSuggestions.push(
      "You have many high-priority tasks. Break them into smaller milestones."
    );
  }

  if (productivity < 50 && total > 0) {
    aiSuggestions.push(
      "Focus on completing In Progress tasks before creating new ones."
    );
  }

  if (completed >= 5) {
    aiSuggestions.push(
      "Excellent productivity today. Keep the momentum going."
    );
  }

  if (total === 0) {
    aiSuggestions.push(
      "Create tasks to start receiving AI productivity insights."
    );
  }

  const notifications = [
    overdue > 0 && `⚠ ${overdue} overdue task(s) require attention.`,
    highPriority > 0 &&
      `🔥 ${highPriority} high priority task(s) detected.`,
    completed > 0 &&
      `✅ ${completed} task(s) completed successfully.`,
  ].filter(Boolean);

  const priorityClass = (priority) => {
    if (priority === "High") return "priority-high";

    if (priority === "Medium") return "priority-medium";

    return "priority-low";
  };

  const formatTime = () => {
    const minutes = Math.floor(timer / 60);

    const seconds = timer % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const TaskCard = ({ task, index, draggable = false }) => {
    const card = (
      <div className="neo-task-card">
        <div className="task-card-top">
          <h5>{task.title}</h5>

          <button onClick={() => openEditForm(task)}>
            ✎
          </button>
        </div>

        <p>{task.description}</p>

        <div className="task-tags">
          <span className="category-tag">
            #{task.category || "General"}
          </span>

          <span className={priorityClass(task.priority)}>
            {task.priority}
          </span>
        </div>

        <div className="task-meta">
          <span>
            📅{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "No due date"}
          </span>
        </div>

        <p>
          👤 <b>Assigned:</b>{" "}
          {task.assignedTo || "Not assigned"}
        </p>

        {task.attachment && (
          <a
            href={`http://localhost:5000${task.attachment}`}
            target="_blank"
            rel="noreferrer"
          >
            📎 View Attachment
          </a>
        )}

        <select
          className="status-select"
          value={normalizeStatus(task.status)}
          onChange={(e) =>
            changeStatus(task, e.target.value)
          }
        >
          {columns.map((column) => (
            <option key={column}>{column}</option>
          ))}
        </select>

        <div className="task-actions">
          <button onClick={() => openEditForm(task)}>
            Edit
          </button>

          <button onClick={() => removeTask(task._id)}>
            Delete
          </button>
        </div>
      </div>
    );

    if (!draggable) return card;

    return (
      <Draggable draggableId={task._id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {card}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className={`neo-wrapper ${darkMode ? "dark-ui" : "light-ui"}`}>
      <Toaster position="top-right" />

      <aside className="neo-sidebar">
        <div className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item}
              className={
                activeView === item ? "active" : ""
              }
              onClick={() => setActiveView(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </aside>

      <main className="neo-main" id="report-section">
        <div className="topbar">
          <div>
            <h1>Task Command Center</h1>

            <p>Welcome back, {user?.name}</p>
          </div>

          <div className="top-actions">
            <button
              className="neo-btn primary"
              onClick={openCreateForm}
            >
              + New Task
            </button>

            <button
              className="neo-btn primary"
              onClick={exportPDF}
            >
              Export PDF
            </button>

            <button
              className="neo-btn"
              onClick={() =>
                setDarkMode(!darkMode)
              }
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              className="neo-btn danger"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Tasks</span>
            <h2>{total}</h2>
          </div>

          <div className="stat-card">
            <span>Productivity</span>
            <h2>{productivity}%</h2>
          </div>

          <div className="stat-card">
            <span>High Priority</span>
            <h2>{highPriority}</h2>
          </div>

          <div className="stat-card danger-stat">
            <span>Overdue</span>
            <h2>{overdue}</h2>
          </div>
        </div>

        <div className="progress-panel">
          <div className="d-flex justify-content-between">
            <b>Project Progress</b>

            <b>{productivity}%</b>
          </div>

          <div className="neo-progress">
            <div
              style={{
                width: `${productivity}%`,
              }}
            ></div>
          </div>
        </div>

        {showForm && (
          <div className="task-modal">
            <div className="task-form glass-card">
              <div className="d-flex justify-content-between mb-3">
                <h3>
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h3>

                <button
                  className="close-btn"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitTask}>
                <input
                  className="neo-input"
                  name="title"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />

                <textarea
                  className="neo-input"
                  name="description"
                  placeholder="Task description"
                  value={formData.description}
                  onChange={handleChange}
                />

                <div className="form-grid">
                  <input
                    className="neo-input"
                    name="category"
                    placeholder="Category"
                    value={formData.category}
                    onChange={handleChange}
                  />

                  <input
                    className="neo-input"
                    name="assignedTo"
                    placeholder="Assign to team member"
                    value={formData.assignedTo}
                    onChange={handleChange}
                  />

                  <input
                    className="neo-input"
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />

                  <input
                    className="neo-input"
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(
                        e.target.files[0]
                      )
                    }
                  />

                  <select
                    className="neo-input"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <select
                    className="neo-input"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {columns.map((column) => (
                      <option key={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="neo-btn primary w-100 mt-3">
                  {editingTask
                    ? "Save Changes"
                    : "Add Task"}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="search-panel">
          <input
            placeholder="Search by title, category, or description..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {activeView === "Board" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {columns.map((column) => (
                <Droppable
                  droppableId={column}
                  key={column}
                >
                  {(provided) => (
                    <section
                      className="kanban-column"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className="column-header">
                        <h4>{column}</h4>

                        <span>
                          {
                            tasksByStatus(column)
                              .length
                          }
                        </span>
                      </div>

                      <div className="column-body">
                        {tasksByStatus(column)
                          .length === 0 ? (
                          <p className="empty-text">
                            No tasks here
                          </p>
                        ) : (
                          tasksByStatus(column).map(
                            (task, index) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                index={index}
                                draggable
                              />
                            )
                          )
                        )}

                        {provided.placeholder}
                      </div>
                    </section>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}

        {activeView === "Tasks" && (
          <div className="glass-card p-4">
            <h3>All Tasks</h3>

            {filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
              />
            ))}
          </div>
        )}

        {activeView === "Calendar" && (
          <div className="glass-card p-4">
            <h3>Upcoming Due Dates</h3>

            {filteredTasks
              .filter((task) => task.dueDate)
              .map((task) => (
                <p key={task._id}>
                  📅 <b>{task.title}</b> —{" "}
                  {new Date(
                    task.dueDate
                  ).toLocaleDateString()}
                </p>
              ))}
          </div>
        )}

        {activeView === "Analytics" && (
          <div className="glass-card p-4">
            <h3>Analytics Dashboard</h3>

            <div className="row">
              <div
                className="col-md-6"
                style={{ height: 300 }}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      outerRadius={100}
                      label
                    >
                      {chartData.map(
                        (entry, index) => (
                          <Cell key={index} />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="col-md-6"
                style={{ height: 300 }}
              >
                <ResponsiveContainer>
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip />

                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeView === "Activity" && (
          <div className="glass-card p-4">
            <h3>Activity Timeline</h3>

            {activities.length === 0 ? (
              <p>No activities yet.</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity._id}
                  style={{
                    marginBottom: "14px",
                    padding: "14px",
                    borderRadius: "12px",
                    background:
                      "rgba(255,255,255,0.08)",
                  }}
                >
                  ✅ {activity.action}:{" "}
                  <b>{activity.taskTitle}</b>

                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "6px",
                      opacity: 0.7,
                    }}
                  >
                    {new Date(
                      activity.createdAt
                    ).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeView === "AI Assistant" && (
          <div className="glass-card p-4">
            <h3>AI Productivity Assistant</h3>

            <div className="row mt-4">
              <div className="col-md-6 mb-3">
                <div className="stat-card">
                  <span>
                    Smart Productivity Score
                  </span>

                  <h2>
                    {productivity >= 80
                      ? "Excellent 🚀"
                      : productivity >= 50
                      ? "Good 👍"
                      : "Needs Improvement ⚠"}
                  </h2>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="stat-card">
                  <span>
                    Recommended Focus
                  </span>

                  <h2>
                    {overdue > 0
                      ? "Overdue Tasks"
                      : highPriority > 0
                      ? "High Priority"
                      : "Complete Pending"}
                  </h2>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 mt-4">
              <h4>AI Suggestions</h4>

              {aiSuggestions.length === 0 ? (
                <p>
                  🤖 Your workflow looks
                  optimized today.
                </p>
              ) : (
                aiSuggestions.map(
                  (suggestion, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        marginBottom: "10px",
                        borderRadius: "12px",
                        background:
                          "rgba(255,255,255,0.08)",
                      }}
                    >
                      🤖 {suggestion}
                    </div>
                  )
                )
              )}
            </div>

            <div className="glass-card p-4 mt-4">
              <h4>AI Workload Analysis</h4>

              <p>
                📌 Total Active Tasks:{" "}
                <b>
                  {
                    filteredTasks.filter(
                      (task) =>
                        normalizeStatus(
                          task.status
                        ) !== "Completed"
                    ).length
                  }
                </b>
              </p>

              <p>
                🔥 High Priority Tasks:{" "}
                <b>{highPriority}</b>
              </p>

              <p>
                ⏰ Overdue Tasks:{" "}
                <b>{overdue}</b>
              </p>

              <p>
                ✅ Completed Tasks:{" "}
                <b>{completed}</b>
              </p>
            </div>

            <div className="glass-card p-4 mt-4">
              <h4>AI Daily Strategy</h4>

              {overdue > 0 && (
                <p>
                  ⚠ Finish overdue tasks
                  first before starting new
                  work.
                </p>
              )}

              {highPriority > 0 && (
                <p>
                  🚀 Prioritize high-priority
                  tasks during peak focus
                  hours.
                </p>
              )}

              {productivity < 50 && (
                <p>
                  📈 Your completion rate is
                  low. Use the Focus timer to
                  improve concentration.
                </p>
              )}

              {completed > 3 && (
                <p>
                  🎉 Excellent momentum
                  today. Maintain workflow
                  consistency.
                </p>
              )}

              {total === 0 && (
                <p>
                  🧠 Create tasks to unlock
                  AI productivity insights.
                </p>
              )}
            </div>
          </div>
        )}

        {activeView === "Notifications" && (
          <div className="glass-card p-4">
            <h3>Notifications Center</h3>

            {notifications.length === 0 ? (
              <p>No notifications.</p>
            ) : (
              notifications.map(
                (notification, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "12px",
                      padding: "14px",
                      borderRadius: "12px",
                      background:
                        "rgba(255,255,255,0.08)",
                    }}
                  >
                    🔔 {notification}
                  </div>
                )
              )
            )}
          </div>
        )}

        {activeView === "Focus" && (
          <div className="glass-card p-5 text-center">
            <h2>Pomodoro Focus Timer</h2>

            <h1
              style={{
                fontSize: "70px",
              }}
            >
              {formatTime()}
            </h1>

            <button
              className="neo-btn primary me-2"
              onClick={() =>
                setRunning(!running)
              }
            >
              {running ? "Pause" : "Start"}
            </button>

            <button
              className="neo-btn danger"
              onClick={() => {
                setTimer(25 * 60);
                setRunning(false);
              }}
            >
              Reset
            </button>
          </div>
        )}

        {activeView === "Settings" && (
          <div className="glass-card p-4">
            <h3>Settings</h3>

            <p>User: {user?.name}</p>

            <p>Email: {user?.email}</p>

            <button
              className="neo-btn primary me-2"
              onClick={() =>
                setDarkMode(!darkMode)
              }
            >
              Toggle Theme
            </button>

            <button
              className="neo-btn danger"
              onClick={logout}
            >
              Logout Account
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;