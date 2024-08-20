import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import UsersCreateForm from "./UsersCreate.Admin";
import EditUserForm from "./EditFormUser.Admin";
import { FaLock } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

function Users() {
  const [validSession, setValidSession] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [showUsersForm, setShowUsersForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchEmail, setSearchEmail] = useState<string>(""); // State for search input
  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        if (!token || !adminUsername) {
          navigator("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/admin/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          fetchAdminDetails();
          fetchUsersDetails();
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      }
    };

    checkSession();
  }, [navigator]);

  const fetchAdminDetails = async () => {
    try {
      const response = await axios.get("/admin/details", {});
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  };

  const fetchUsersDetails = async () => {
    try {
      const response = await axios.get(`/admin/users/details`);
      const reversedSchedule = response.data.reverse();
      setUsers(reversedSchedule);
    } catch (error) {
      console.error("Error fetching users details:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await axios.delete(`/admin/users/delete/${userId}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Successfully Deleted");
        fetchUsersDetails();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast.error("User record not found");
      } else {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditUserForm(true);
  };

  const handleAddUsersClick = () => {
    setShowUsersForm(true);
  };

  const toggleUserStatus = async (user_id: string, currentStatus: number) => {
    try {
      let response;
      if (currentStatus === 1) {
        response = await axios.put(
          `/admin/user/status/disable/${user_id}`,
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          fetchUsersDetails();
          toast.warn("Meeting disabled successfully");
        }
      } else {
        response = await axios.put(
          `/admin/user/status/enable/${user_id}`,
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          fetchUsersDetails();
          toast.success("Meeting enabled successfully");
        }
      }
    } catch (error) {
      console.error("Error toggling User status:", error);
      toast.error("Error toggling User status");
    }
  };

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(users.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    try {
      const response = await axios.post(`/admin/users/search`, {
        email: searchEmail,
      });
      setUsers(response.data); // Update users with search results
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  return (
    <>
      {validSession && (
        <div>
          <AdminHeader dashboardType="Admin" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              {adminDetails && (
                <div className="bg-white border-t border-r px-2 py-2 border-b border-black flex items-center">
                  <label className="block text-sm font-medium text-gray-700 ml-2 mr-2">
                    Items per Page:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-gray-300 px-2 py-1 rounded-md"
                  >
                    {itemsPerPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <h1 className="text-sm font-serif ml-4 mr-6">
                    Username: {adminDetails.admin_username}
                  </h1>
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="border border-gray-300 px-2 py-1 rounded-md ml-2"
                    placeholder="Search Email..."
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-green-500 hover:bg-green-600 text-white font-serif px-4 py-1 rounded-md ml-2"
                  >
                    Search
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-serif px-4 py-1 rounded-md ml-2"
                    onClick={handleAddUsersClick}
                  >
                    Add Users
                  </button>
                </div>
              )}

              {showUsersForm && (
                <UsersCreateForm onClose={() => setShowUsersForm(false)} />
              )}
              {showEditUserForm && selectedUser && (
                <EditUserForm
                  userDetails={selectedUser}
                  onClose={() => {
                    setShowEditUserForm(false);
                    setSelectedUser(null);
                  }}
                />
              )}
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full font-serif">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                        Division
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 bg-gray-50"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-2 text-center" colSpan={5}>
                          No data found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-no-wrap">
                            {user.user_name}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap">
                            {user.user_division}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap">
                            {user.user_designation}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap">
                            {user.user_email}
                          </td>
                          <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                            <span className="inline-flex items-center">
                              <FaLock
                                className="text-gray-600 mr-4 cursor-pointer"
                                onClick={() =>
                                  toggleUserStatus(
                                    user.user_id,
                                    user.user_status
                                  )
                                }
                                color={
                                  user.user_status === 1 ? "green" : "red"
                                }
                              />
                            </span>
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 ml-2"
                              onClick={() => handleDeleteUser(user.user_id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-2 mb-2 px-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span
                  className={`px-3 py-1 rounded-md mx-1 ${
                    totalPages === 0
                      ? "bg-gray-300 hover:bg-gray-400 opacity-50 "
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {totalPages === 0
                    ? "No Pages"
                    : `${currentPage} | ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
          <ToastContainer />
        </div>
      )}
    </>
  );
}
export default Users;
