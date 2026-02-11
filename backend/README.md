# Backend

This backend is a simple Python server that provides an API for managing a list of items. It's built with FastAPI and allows creating, reading, updating, and deleting items.

## How to Run

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Activate the virtual environment:
    ```bash
    .\venv\Scripts\activate
    ```
3.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```

## `main.py` Logic

The `main.py` file contains the core logic for the FastAPI application.

-   **FastAPI App Initialization**: It initializes a FastAPI application instance.
-   **CORS Middleware**: It includes CORS (Cross-Origin Resource Sharing) middleware to allow requests from the frontend application (running on `http://localhost:5173`).
-   **Data Model**: It defines a `Item` model using Pydantic, which represents the structure of an item in the lost and found list.
-   **In-Memory Database**: It uses a simple in-memory list (`lost_items_db`) to store the items. This means the data will be lost when the server restarts.

## Why `venv`?

A `venv` (virtual environment) is used to create an isolated environment for Python projects. This is important for several reasons:

-   **Dependency Management**: It allows you to install and manage project-specific dependencies without affecting other Python projects on the same machine.
-   **Reproducibility**: It makes it easy to replicate the project's environment on another machine by simply installing the dependencies from the `requirements.txt` file.
-   **Avoiding Conflicts**: It prevents version conflicts between dependencies of different projects.