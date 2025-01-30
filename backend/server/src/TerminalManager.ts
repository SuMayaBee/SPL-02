import { Sandbox } from "e2b"
import { Terminal } from "./Terminal"

export class TerminalManager {
  private sandbox: Sandbox
  private terminals: Record<string, Terminal> = {}

  constructor(sandbox: Sandbox) {
    this.sandbox = sandbox
  }

  async createTerminal(
    id: string,
    onData: (responseString: string) => void
  ): Promise<void> {
    if (this.terminals[id]) {
      return
    }

    this.terminals[id] = new Terminal(this.sandbox)
    await this.terminals[id].init({
      onData,
      cols: 80,
      rows: 20,
    })

    const defaultDirectory = "/home/user/project"
    const defaultCommands = [
      `cd "${defaultDirectory}"`,
      "export PS1='user> '",
      "clear",
    ]
    for (const command of defaultCommands) {
      await this.terminals[id].sendData(command + "\r")
    }

    console.log("Created terminal", id)
  }

  async resizeTerminal(dimensions: {
    cols: number
    rows: number
  }): Promise<void> {
    Object.values(this.terminals).forEach((t) => {
      t.resize(dimensions)
    })
  }

}


