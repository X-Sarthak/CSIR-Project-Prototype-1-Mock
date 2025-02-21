import { useState, useEffect } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import MeetingCreateForm from "./MeetingCreateForm.Admin";
import { FaEdit, FaTrash, FaLock } from "react-icons/fa";
import EditForm from "./EditFormMeeting.Admin";
import { toast, ToastContainer } from "react-toastify";
import Spinner from "../Utility/Spinner.Utility";
import * as XLSX from "xlsx";


axios.defaults.withCredentials = true;

function MeetingRoom() {
  const [validSession, setValidSession] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // New state for the select dropdown
  const [editMeeting, setEditMeeting] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1); // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true); // Start loading
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
          fetchMeetingDetails();
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      } 
      finally {
        setLoading(false); // End loading
      }
    };

    checkSession();
  }, [navigator]);

  const fetchAdminDetails = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get("/admin/details", {});
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }  finally {
      setLoading(false); // End loading
    }
  };

  const fetchMeetingDetails = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(`/admin/meetings/details`);
      const reversedSchedule = response.data.reverse();
      setMeetings(reversedSchedule);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
    }
    finally {
      setLoading(false); // End loading
    }
  };

  const handleAddMeetingClick = () => {
    setShowMeetingForm(true);
  };

  const handleCloseMeetingForm = () => {
    setShowMeetingForm(false);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setLoading(true); // Start loading
    try {
      await axios.delete(`/admin/meetings/delete/${meetingId}`, {
        withCredentials: true,
      });
      toast.success("Successfully Deleted");
      fetchMeetingDetails();
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 404) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 500) {
          toast.error(error.response.data.error);
        } else {
          toast.error("An error occurred. Please try again later.");
        }
      } else {
        toast.error("Network error. Please try again later.");
      }
      console.error("Error deleting meeting:", error);
    }
    finally {
      setLoading(false); // End loading
    }
  };

  const toggleMeetingStatus = async (
    meetingId: string,
    currentStatus: number
  ) => {
    setLoading(true); // Start loading
    try {
      let response;
      if (currentStatus === 1) {
        response = await axios.put(
          `/admin/meetings/status/disable/${meetingId}`,
          null,
          {
            withCredentials: true,
          }
        );
        if (response.status === 200) {
          fetchMeetingDetails();
        }
      } else {
        response = await axios.put(
          `/admin/meetings/status/enable/${meetingId}`,
          null,
          {
            withCredentials: true,
          }
        );
        if (response.status === 200) {
          fetchMeetingDetails();
        }
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 404) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 500) {
          toast.error(error.response.data.error);
        } else {
          toast.error("An error occurred. Please try again later.");
        }
      } else {
        toast.error("Network error. Please try again later.");
      }
      console.error("Error toggling meeting status:", error);
    }
    finally {
      setLoading(false); // End loading
    }
  };

  const handleEditMeeting = (meeting: any) => {
    setEditMeeting(meeting);
  };


  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/admin/meetings/search`, {
        category: selectedCategory,
        text: searchText,
      });
      if (response.data.length > 0) {
        setMeetings(response.data);
        toast.success("Search results fetched successfully!");
      } else {
        setMeetings([]);
        toast.warn("No matching records found.");
      }

    } catch (error) {
      console.error("Error fetching search results:", error);

      const err = error as any;

      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Error fetching search results.");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleResetClick = () => {
    setMeetings([]); // Clear the users data
    setSelectedCategory(""); // Reset the category selection to default
    setSearchText(""); // Clear the search text input
    setItemsPerPage(10); // Reset items per page to the default value
    fetchMeetingDetails(); // Refetch all users to reset the table
  };

  const handlePrintClick = () => {
    if (meetings.length === 0) {
      toast.info("No meeting data available to export.");
      return;
    }

    // Prepare data with custom headers
    const meetingsWithCustomHeaders = meetings.map((meeting) => ({
      "Room Name": meeting.room_name,
      "Approver Name": meeting.authority_name,
      "Meeting Username": meeting.meeting_username,
      "Meeting Available Days": meeting.meeting_days,
    }));

    // Create worksheet with custom headers
    const ws = XLSX.utils.json_to_sheet(meetingsWithCustomHeaders);

    // Set column widths (optional, but can be adjusted as needed)
    ws["!cols"] = [
      { width: 20 }, // Room Name
      { width: 25 }, // Approver Name
      { width: 30 }, // Meeting Username
      { width: 50 }, // Meeting Available Days
    ];

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meetings");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "Meetings_CSIR_Data.xlsx");
  };


  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = meetings.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(meetings.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [5, 10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
    {loading && <Spinner />}
      {validSession && (
        <div>
          <AdminHeader dashboardType="Meeting Room" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5">
                <h1 className="text-xl font-serif text-center text-white">
                  Meeting Rooms
                </h1>
              </div>
              {adminDetails && (
                <div className="bg-white px-1 py-1 mt-2 mb-2 border-r border-t border-b border-black flex items-center">
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
                  <h1 className="block text-sm font-medium text-gray-700 ml-2 mr-2">
                    Username: {adminDetails.admin_username}
                  </h1>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 px-2 py-1 rounded-md ml-2"
                  >
                      <option value=""> Not Selected</option>
                    <option value="Room Name">Room Name</option>
                    <option value="Approver Name"> Approver Name</option>
                    <option value="Meeting Username"> Meeting Username</option>
                  </select>
                  {/* Search Email Input */}
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="border border-gray-300 px-2 py-1 rounded-md ml-2"
                    placeholder="Search"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 border border-black rounded-md ml-2"
                  >
                    Search
                  </button>
                  <button
                      onClick={handleResetClick} // Update to your search handler
                      className="ml-2 px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handlePrintClick} // Update to your search handler
                      className="ml-2 px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Print
                    </button>
                  <button
                    className="px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600 ml-2"
                    onClick={handleAddMeetingClick}
              >
                Add Rooms
              </button>
                </div>
              )}
              <div>
                {currentItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No data found for the selected filters.</p>
                  </div>
                ) : (
                  currentItems.map((meeting, index) => (
                    <div
                      key={index}
                      className="bg-white border-t border-r border-b border-black p-4 mb-2 flex justify-between items-center font-serif"
                    >
                      <div>
                        <p>Room Name: {meeting.room_name}</p>
                        <p>Approver Name: {meeting.authority_name}</p>
                        <p>Username: {meeting.meeting_username}</p>
                        <p>Meeting Available: {meeting.meeting_days}</p>
                        <div className="justify-between">
                        <p>Start Time: {meeting.start_time}</p>
                        <p>End Time: {meeting.end_time}</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <FaLock
                          className="cursor-pointer"
                          onClick={() =>
                            toggleMeetingStatus(
                              meeting.meeting_id,
                              meeting.meeting_status
                            )
                          }
                          color={meeting.meeting_status === 1 ? "green" : "red"}
                        />
                        <FaEdit
                          className="cursor-pointer"
                          onClick={() => handleEditMeeting(meeting)}
                          color={"blue"}
                        />
                        <FaTrash
                          className="cursor-pointer"
                          onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                          color={"red"}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Pagination Controls */}
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
                    : `${currentPage} / ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <ToastContainer />
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
        </div>
      )}
      {showMeetingForm && (
        <MeetingCreateForm onClose={handleCloseMeetingForm} />
      )}
      {editMeeting && (
        <EditForm meeting={editMeeting} onClose={() => setEditMeeting(null)} />
      )}
    </>
  );
}

export default MeetingRoom;
