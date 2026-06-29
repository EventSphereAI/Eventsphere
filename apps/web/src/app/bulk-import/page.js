"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function BulkImportPage() {

    const [events, setEvents] = useState([]);

    const [eventId, setEventId] = useState("");

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    useEffect(() => {

        loadEvents();

    }, []);

    async function loadEvents() {

        try {

            const res = await api.get("/api/events/");

            setEvents(res.data.events);

        }

        catch (err) {

            console.error(err);

        }

    }

    async function importDelegates() {

    if (!eventId) {

        alert("Please select an event.");

        return;
    }

    if (!file) {

        alert("Please choose an Excel/CSV file.");

        return;
    }

    try {

        setLoading(true);

        setMessage("");

        const formData = new FormData();

        formData.append("event_id", eventId);

        formData.append("file", file);

        const res = await api.post(

            "/api/bulk/import",

            formData,

            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }

        );

        setMessage(

            `Imported ${res.data.imported} delegates successfully. Skipped: ${res.data.skipped}`

        );

    }

    catch (err) {

        console.error(err);

        alert(

            err.response?.data?.detail ||

            err.response?.data?.error ||

            "Import failed."

        );

    }

    finally {

        setLoading(false);

    }

}

async function sendEmails() {

    if (!eventId) {
        alert("Please select an event.");
        return;
    }

    try {

        setLoading(true);

        const res = await api.post(
            `/api/bulk/send-emails?event_id=${eventId}`
        );

        alert(res.data.message);

    } catch (err) {

        console.error(err);

        alert(
            err.response?.data?.detail ||
            err.response?.data?.error ||
            "Failed to start email campaign."
        );

    } finally {

        setLoading(false);

    }

}

    return (

    <div className="max-w-3xl mx-auto py-10">

        <h1 className="text-3xl font-bold mb-8">
            Bulk Delegate Import
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">

            {/* Event */}

            <div>

                <label className="block mb-2 font-medium">
                    Select Event
                </label>

                <select
                    className="w-full border rounded-lg px-4 py-3"
                    value={eventId}
                    onChange={(e) =>
                        setEventId(e.target.value)
                    }
                >

                    <option value="">
                        Select Event
                    </option>

                    {events.map((event) => (

                        <option
                            key={event.id}
                            value={event.id}
                        >
                            {event.title}
                        </option>

                    ))}

                </select>

            </div>

            {/* File */}

            <div>

                <label className="block mb-2 font-medium">
                    Excel File
                </label>

                <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) =>
                        setFile(
                            e.target.files[0]
                        )
                    }
                />

            </div>

            <button

    onClick={importDelegates}

    disabled={loading}

    className="bg-primary text-white px-6 py-3 rounded-lg"

>

    {loading ? "Importing..." : "Import Delegates"}

</button>

<button
    onClick={sendEmails}
    disabled={loading}
    className="bg-green-600 text-white px-6 py-3 rounded-lg"
>
    Send Registration Emails
</button>

            {message && (

                <div className="p-4 rounded bg-green-100">

                    {message}

                </div>

            )}

        </div>

    </div>

);
}