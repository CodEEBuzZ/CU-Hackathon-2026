import React, { useState } from 'react';

const Login = () => {
    // 1. Define state for inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:4000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('userId', data.userId);
                // Redirect to the main dashboard
                window.location.href = '/';
            } else {
                alert(data.message || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Login to Code Assistant</h1>
            <form onSubmit={handleSubmit} className="flex flex-col bg-gray-800 p-8 rounded shadow-lg">
                <input
                    type="text"
                    placeholder="Username"
                    className="border border-gray-600 bg-gray-700 p-2 m-2 rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="border border-gray-600 bg-gray-700 p-2 m-2 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 m-2 rounded font-bold">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;