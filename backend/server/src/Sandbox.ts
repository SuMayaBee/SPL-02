import { Sandbox as E2BSandbox } from "e2b"
import { Socket } from "socket.io"

const CONTAINER_TIMEOUT = 120_000

import { FileManager } from "./FileManager"
import { TerminalManager } from "./TerminalManager"
import { TFile, TFolder } from "./types"
import { LockManager } from "./utils"
const lockManager = new LockManager()


// Define a type for SocketHandler functions
type SocketHandler<T = Record<string, any>> = (args: T) => any


export class Sandbox {
  // Sandbox properties:
  sandboxId: string
  type: string
  fileManager: FileManager | null
  terminalManager: TerminalManager | null
  container: E2BSandbox | null
  // Server context: [Future]

  constructor(
    sandboxId: string,
    type: string,
    // Server context: [Future]
  ) {
    // Sandbox properties:
    this.sandboxId = sandboxId
    this.type = type
    this.fileManager = null
    this.terminalManager = null
    this.container = null
    // Server context: [Future]
  }

  // Initializes the container for the sandbox environment
  async initialize(fileWatchCallback: ((files: (TFolder | TFile)[]) => void) | undefined
  ) {
    // Acquire a lock to ensure exclusive access to the sandbox environment
    await lockManager.acquireLock(this.sandboxId, async () => {
      // Check if a container already exists and is running
      if (this.container && (await this.container.isRunning())) {
        console.log(`Found existing container ${this.sandboxId}`)
      } else {
        console.log("Creating container", this.sandboxId)
        // Create a new container with a specified template and timeout
        const templateTypes = [
          "vanillajs",
          "reactjs",
          "nextjs",
          "streamlit",
          "php",
        ]
        const template = templateTypes.includes(this.type)
          ? `gitwit-${this.type}`
          : `base`
        this.container = await E2BSandbox.create(template, {
          timeoutMs: CONTAINER_TIMEOUT,
        })
      }
    })
    // Ensure a container was successfully created
    if (!this.container) throw new Error("Failed to create container")

    // Initialize the terminal manager if it hasn't been set up yet
    if (!this.terminalManager) {
      this.terminalManager = new TerminalManager(this.container)
      console.log(`Terminal manager set up for ${this.sandboxId}`)
    }

    // Initialize the file manager if it hasn't been set up yet
    if (!this.fileManager) {
      this.fileManager = new FileManager(
        this.sandboxId,
        this.container,
        fileWatchCallback ?? null
      )
      // Initialize the file manager and emit the initial files
      await this.fileManager.initialize()
    }
  }

  // Called when the client disconnects from the Sandbox
  async disconnect() {
    console.log("Disconnecting sandbox", this.sandboxId);
    // Disconnect the sandbox container
  }

  handlers(connection: { userId: string; isOwner: boolean; socket: Socket }) {
    // Handle heartbeat from a socket connection
    const handleHeartbeat: SocketHandler = (_: any) => {
      // Only keep the sandbox alive if the owner is still connected
      if (connection.isOwner) {
        this.container?.setTimeout(CONTAINER_TIMEOUT)
      }
    }

    // Handle getting a file
    const handleGetFile: SocketHandler = ({ fileId }: any) => {
      console.log("Getting file", fileId);
    }

    // Handle getting a folder
    const handleGetFolder: SocketHandler = ({ folderId }: any) => {
      console.log("Getting folder", folderId);
    }

    // Handle saving a file
    const handleSaveFile: SocketHandler = async ({ fileId, body }: any) => {
      console.log("Saving file", fileId);
    }

    // Handle moving a file
    const handleMoveFile: SocketHandler = ({ fileId, folderId }: any) => {
      console.log("Moving file", fileId, folderId);
    }

    // Handle listing apps
    const handleListApps: SocketHandler = async (_: any) => {
      console.log("Listing apps");
    }

    // Handle getting app creation timestamp
    const handleGetAppCreatedAt: SocketHandler = async ({ appName }) => {
      console.log("Getting app creation time", appName);
    }

    // Handle checking if an app exists
    const handleAppExists: SocketHandler = async ({ appName }) => {
      console.log("Checking if app exists", appName);
    }

    // Handle deploying code
    const handleDeploy: SocketHandler = async (_: any) => {
      console.log("Deploying code");
    }

    // Handle creating a file
    const handleCreateFile: SocketHandler = async ({ name }: any) => {
      console.log("Creating file", name);
    }

    // Handle creating a folder
    const handleCreateFolder: SocketHandler = async ({ name }: any) => {
      console.log("Creating folder", name);
    }

    // Handle renaming a file
    const handleRenameFile: SocketHandler = async ({
      fileId,
      newName,
    }: any) => {
      console.log("Renaming file", fileId, newName);
    }

    // Handle deleting a file
    const handleDeleteFile: SocketHandler = async ({ fileId }: any) => {
      console.log("Deleting file", fileId);
    }

    // Handle deleting a folder
    const handleDeleteFolder: SocketHandler = ({ folderId }: any) => {
      console.log("Deleting folder", folderId);
    }

    // Handle creating a terminal session
    const handleCreateTerminal: SocketHandler = async ({ id }: any) => {
      console.log("Creating terminal", id);
    }

    // Handle resizing a terminal
    const handleResizeTerminal: SocketHandler = ({ dimensions }: any) => {
      console.log("Resizing terminal", dimensions);
    }

    // Handle sending data to a terminal
    const handleTerminalData: SocketHandler = ({ id, data }: any) => {
      console.log("Sending data to terminal", id, data);
    }

    // Handle closing a terminal
    const handleCloseTerminal: SocketHandler = ({ id }: any) => {
      console.log("Closing terminal", id);
    }

    // Handle downloading files by download button
    const handleDownloadFiles: SocketHandler = async () => {
      console.log("Downloading files");
    }

    return {
      heartbeat: handleHeartbeat,
      getFile: handleGetFile,
      getFolder: handleGetFolder,
      downloadFiles: handleDownloadFiles,
      saveFile: handleSaveFile,
      moveFile: handleMoveFile,
      listApps: handleListApps,
      getAppCreatedAt: handleGetAppCreatedAt,
      getAppExists: handleAppExists,
      deploy: handleDeploy,
      createFile: handleCreateFile,
      createFolder: handleCreateFolder,
      renameFile: handleRenameFile,
      deleteFile: handleDeleteFile,
      deleteFolder: handleDeleteFolder,
      createTerminal: handleCreateTerminal,
      resizeTerminal: handleResizeTerminal,
      terminalData: handleTerminalData,
      closeTerminal: handleCloseTerminal,
    }
  }
}
