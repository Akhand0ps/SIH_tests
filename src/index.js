import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` MongoDB configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
    console.log(`Server listening on all interfaces (0.0.0.0:${PORT})`);
});






