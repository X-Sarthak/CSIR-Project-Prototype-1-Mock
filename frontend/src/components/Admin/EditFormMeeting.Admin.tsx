import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import Spinner from "../Utility/Spinner.Utility";

interface Meeting {
  meeting_id: string;
  room_name: string;
  authority_name: string;
  meeting_username: string;
  meeting_password: string;
  start_time: string;
  end_time: string;
}

interface Props {
  meeting: Meeting;
  onClose: () => void;
}

function EditForm({ meeting, onClose }: Props) {
  const [formData, setFormData] = useState({
    meetingId: meeting.meeting_id || "",
    roomName: meeting.room_name || "",
    authorityName: meeting.authority_name || "",
    meetingUsername: meeting.meeting_username || "",
    meetingPassword: "",
    startTime: "" ,
    endTime: "" ,
    
  });
    const [loading, setLoading] = useState(false);


  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when form submission starts
  
    if (formData.meetingUsername.includes(" ")) {
      toast.error("Spaces are not allowed in the meeting username.");
      setLoading(false); // Set loading to false when form submission ends
      return;
    }
    if (formData.meetingPassword.includes(" ")) {
      toast.error("Spaces are not allowed in the meeting password.");
      setLoading(false); // Set loading to false when form submission ends
      return;
    }
  
    try {
      // Make API call using Axios
      await axios.put(
        `/admin/meetings/update/${formData.meetingId}`,
        formData,
        {
          withCredentials: true, // Include cookies in the request
        }
      );
      
      // Close the form after successful submission
      onClose();
      
      // Reload the window
      window.location.reload();
    } catch (error: any) {
      if (error.response) {
        // Check the status and handle accordingly
        if (error.response.status === 400) {
          if (error.response.data.error === "End time must be greater than start time") {
            toast.error("End time must be greater than start time.");
          } else if (error.response.data.error === "Meeting username already exists for another meeting.") {
            toast.error("Meeting username already exists for another meeting.");
          } else if (error.response.data.error === "No fields to update.") {
            toast.error("No fields to update.");
          } else {
            toast.error(error.response.data.error);
          }
        } else if (error.response.status === 401) {
          toast.error("Access denied. Invalid token.");
        } else {
          toast.error("An error occurred while updating meeting details.");
        }
      } else {
        toast.error("Error updating meeting details.");
      }
      console.error("Error updating meeting details:", error);
    } finally {
      setLoading(false); // Set loading to false when form submission ends
    }
  };
  

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
      {loading && <Spinner/>}
      <div ref={formRef} className="bg-white p-6 rounded-md shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-6">Edit Meeting Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="roomName"
              className="block font-semibold mb-1"
              >
              Room Name:
            </label>
            <input
              type="text"
              id="roomName"
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}              
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
              
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="authorityName"
              className="block font-semibold mb-1"
              >
              Authority Name:
            </label>
            <input
              type="text"
              id="authorityName"
              name="authorityName"
              value={formData.authorityName}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="meetingUsername"
              className="block font-semibold mb-1"
              >
              Meeting Username:
            </label>
            <input
              type="text"
              id="meetingUsername"
              name="meetingUsername"
              value={formData.meetingUsername}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="meetingPassword"
              className="block font-semibold mb-1"
              >
              Meeting New Password:
            </label>
            <input
              type="password"
              id="meetingPassword"
              name="meetingPassword"
              value={formData.meetingPassword}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-between mb-3">
              <div className="flex-1 mr-2">
                <label htmlFor="startTime" className="block font-semibold mb-1">
                  Start Time:
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 ml-2">
                <label htmlFor="endTime" className="block font-semibold mb-1">
                  End Time:
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Save
            </button>
            <ToastContainer />
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditForm;
