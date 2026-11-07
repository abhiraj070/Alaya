from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from fastapi import HTTPException
from app.api.user import update_user_helper
from app.db.connect import SessionLocal
from app.db.model import chat, universe  # noqa: F401 -- register related ORM models
from app.schema.user import AuthResponse

mcp= MCPServer("Alaya")

@mcp.tool()
def update_user_settings(phone_number: str, name: str = "", username: str = "") -> AuthResponse:
    """Update name or username by exact stored phone number on this trusted local server."""
    with SessionLocal() as db:
        try:
            user = update_user_helper(db, name, username, phone_number=phone_number.strip())
        except HTTPException as exc:
            raise ToolError(exc.detail) from exc
        return AuthResponse(id=user.id, name=user.name, username=user.username)


if __name__ == "__main__":
    mcp.run(transport="stdio")

