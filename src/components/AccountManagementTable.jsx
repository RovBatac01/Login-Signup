import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Container,
  Form,
  Button,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Pencil, Trash2, Plus, Search, Filter, Shield, User, CheckCircle, XCircle } from "lucide-react";
import AdminCreationForm from "./AddAdminAccountForm";
import axios from "axios";
import "../styles/Components Css/AccountManagementTable.css";
import { ThemeContext } from "../context/ThemeContext";

const UserAdminTable = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: "", email: "" });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
    return () => {
      document.body.classList.remove("dark", "light");
    };
  }, [theme]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/users");
        setAccounts(response.data);
      } catch (err) {
        setError("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleAddAdmin = async (newAdmin) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users",
        newAdmin
      );
      if (response.status === 201) {
        setAccounts((prev) => [...prev, response.data]);
      }
    } catch (error) {
      console.error("Error creating admin:", error);
    } finally {
      setShowAddAdminModal(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, email: user.email || "" });
    setShowEditUserModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditError(null);
      await axios.put(
        `http://localhost:5000/api/users/${editingUser.id}`,
        editFormData
      );
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === editingUser.id ? { ...acc, ...editFormData } : acc
        )
      );
      setShowEditUserModal(false);
    } catch (err) {
      setEditError("Failed to update user details.");
    }
  };

  const handleInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      (filterRole === "All" || account.role === filterRole) &&
      (account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container className={`acctbl-container ${theme}`} fluid style={{ maxWidth: "100%", padding: 0, margin: 0 }}>
      <div className="acctbl-controls">
        <div className="acctbl-search-container" style={{ position: 'relative', flex: 2 }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#aaa' : '#666' }} />
          <Form.Control
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="acctbl-search-input"
            style={{ paddingLeft: '40px' }}
          />
        </div>
        
        <div className="acctbl-filter-container" style={{ position: 'relative', flex: 1 }}>
          <Filter size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#aaa' : '#666' }} />
          <Form.Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="acctbl-filter-select"
            style={{ paddingLeft: '40px' }}
          >
            <option value="All">All Roles</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Super Admin">Super Admin</option>
          </Form.Select>
        </div>
        
        <Button
          onClick={() => setShowAddAdminModal(true)}
          className="acctbl-add-btn"
        >
          <Plus size={18} /> Add Admin
        </Button>
      </div>

      {loading && <Spinner animation="border" className="acctbl-spinner" />}
      {error && <Alert variant="danger" className="acctbl-error-alert">{error}</Alert>}

      <div className="acctbl-table-scroll-wrapper">
        <Table className="acctbl-data-table" variant={theme === 'dark' ? 'dark' : 'light'} style={{ background: theme === 'dark' ? '#2f2f31' : '#ffffff' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} /> Role
                </span>
              </th>
              <th>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> Verified
                </span>
              </th>
              <th>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> Email Verified
                </span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <tr key={account.id} style={{ background: theme === 'dark' ? '#2f2f31' : 'inherit' }}>
                  <td style={{ color: theme === 'dark' ? '#f8f9fa' : 'inherit' }}>{account.id}</td>
                  <td style={{ color: theme === 'dark' ? '#f8f9fa' : 'inherit' }}>{account.username}</td>
                  <td style={{ color: theme === 'dark' ? '#f8f9fa' : 'inherit' }}>{account.email}</td>
                  <td>
                    <span className={`role-badge ${account.role.toLowerCase()}`} 
                          style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            background: account.role === 'Super Admin' || account.role === 'SuperAdmin' || account.role === 'Super_Admin' ?
                              (theme === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)') :
                              account.role === 'Admin' ? 
                                (theme === 'dark' ? 'rgba(27, 86, 253, 0.2)' : 'rgba(27, 86, 253, 0.1)') : 
                                (theme === 'dark' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(40, 167, 69, 0.1)'),
                            color: account.role === 'Super Admin' || account.role === 'SuperAdmin' || account.role === 'Super_Admin' ?
                              (theme === 'dark' ? '#4dabf5' : '#1976d2') :
                              account.role === 'Admin' ? 
                                (theme === 'dark' ? '#6a92ed' : '#1B56FD') : 
                                (theme === 'dark' ? '#74c686' : '#28a745'),
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                      {account.role === 'Admin' || account.role === 'Super Admin' || account.role === 'SuperAdmin' || account.role === 'Super_Admin' ? (
                        <Shield size={14} style={{ strokeWidth: 2.5 }} />
                      ) : (
                        <User size={14} style={{ strokeWidth: 2.5 }} />
                      )}
                      {account.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: account.is_verified ? 
                        (theme === 'dark' ? '#74c686' : '#28a745') : 
                        (theme === 'dark' ? '#e57373' : '#dc3545'),
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {account.is_verified ? (
                        <CheckCircle size={16} style={{ strokeWidth: 2.5 }} />
                      ) : (
                        <XCircle size={16} style={{ strokeWidth: 2.5 }} />
                      )}
                      {account.is_verified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: account.email_verified ? 
                        (theme === 'dark' ? '#74c686' : '#28a745') : 
                        (theme === 'dark' ? '#e57373' : '#dc3545'),
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {account.email_verified ? (
                        <CheckCircle size={16} style={{ strokeWidth: 2.5 }} />
                      ) : (
                        <XCircle size={16} style={{ strokeWidth: 2.5 }} />
                      )}
                      {account.email_verified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="acctbl-actions-cell">
                    <button
                      className="acctbl-edit-btn"
                      onClick={() => handleEdit(account)}
                    >
                      <Pencil size={16} /> Edit
                    </button>
                    <button
                      className="acctbl-delete-btn"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="acctbl-no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Admin Creation Modal */}
      <Modal show={showAddAdminModal} onHide={() => setShowAddAdminModal(false)} className="acctbl-add-admin-modal">
        <Modal.Header closeButton>
          <Modal.Title>Create Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AdminCreationForm
            onClose={() => setShowAddAdminModal(false)}
            onAddAdmin={handleAddAdmin}
          />
        </Modal.Body>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)} className="acctbl-edit-user-modal">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3 acctbl-form-group">
              <Form.Label className="acctbl-form-label">Username</Form.Label>
              <Form.Control
                name="username"
                value={editFormData.username}
                onChange={handleInputChange}
                className="acctbl-form-control"
              />
            </Form.Group>
            <Form.Group className="mb-3 acctbl-form-group">
              <Form.Label className="acctbl-form-label">Email</Form.Label>
              <Form.Control
                name="email"
                value={editFormData.email}
                onChange={handleInputChange}
                className="acctbl-form-control"
              />
            </Form.Group>
            {editError && <Alert variant="danger" className="acctbl-edit-error-alert">{editError}</Alert>}
            <Modal.Footer className="acctbl-modal-footer">
              <Button type="submit" className="acctbl-save-changes-btn">
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEditUserModal(false)}
                className="acctbl-cancel-edit-btn"
              >
                Cancel
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserAdminTable;