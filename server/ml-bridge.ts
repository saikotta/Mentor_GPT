import { spawn } from "child_process";
import path from "path";

export async function callML(command: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        // Determine the absolute path to the bridge script
        // We assume the script is in the 'ml' directory in the project root
        const bridgePath = path.resolve(process.cwd(), "ml", "bridge.py");

        // Launch Python process
        const pyProcess = spawn("python", [bridgePath]);

        let output = "";
        let errorOutput = "";

        // Send the request as JSON to stdin
        const request = JSON.stringify({ command, payload });
        pyProcess.stdin.write(request);
        pyProcess.stdin.end();

        // Capture stdout
        pyProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        // Capture stderr
        pyProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        // Handle process completion
        pyProcess.on("close", (code) => {
            if (code !== 0) {
                console.error(`ML Bridge Error: ${errorOutput}`);
                return reject(new Error(`ML process exited with code ${code}: ${errorOutput}`));
            }

            try {
                const result = JSON.parse(output);
                if (result.error) {
                    return reject(new Error(`ML Logic Error: ${result.error}\n${result.traceback || ""}`));
                }
                resolve(result);
            } catch (e) {
                console.error(`Failed to parse ML output: ${output}`);
                reject(new Error(`Invalid JSON from ML bridge: ${output}`));
            }
        });

        // Handle startup errors
        pyProcess.on("error", (err) => {
            reject(new Error(`Failed to start ML bridge: ${err.message}. Ensure 'python' is in PATH.`));
        });
    });
}
