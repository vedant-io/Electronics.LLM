'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Terminal,
  Upload,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react'
import { checkBoards, compileProject, flashProject } from '@/lib/api'

interface CompileAgentProps {
  projectName: string
  code: string
  onComplete: () => void
}

export function CompileAgent({ projectName, code, onComplete }: CompileAgentProps) {
  const [isCompiling, setIsCompiling] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [compileStatus, setCompileStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [flashStatus, setFlashStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [arduinoConnected, setArduinoConnected] = useState(false)
  const [checkingArduino, setCheckingArduino] = useState(true)
  const [detectedPort, setDetectedPort] = useState<string>('')
  const [detectedFqbn, setDetectedFqbn] = useState<string>('arduino:avr:uno')

  // Check for Arduino connection via Backend API
  useEffect(() => {
    let mounted = true;
    const checkArduino = async () => {
      try {
        setCheckingArduino(true)
        const data = await checkBoards()
        
        if (mounted) {
          if (data.detected_ports && data.detected_ports.length > 0) {
            setArduinoConnected(true)
            const portInfo = data.detected_ports[0]
            setDetectedPort(portInfo.port.address)
            if (portInfo.matching_boards && portInfo.matching_boards.length > 0) {
              setDetectedFqbn(portInfo.matching_boards[0].fqbn)
            }
          } else {
            setArduinoConnected(false)
            setDetectedPort('')
          }
        }
      } catch (err) {
        console.error('Board check failed:', err)
        if (mounted) setArduinoConnected(false)
      } finally {
        if (mounted) setCheckingArduino(false)
      }
    }

    checkArduino()
    const interval = setInterval(checkArduino, 5000) // Check every 5 seconds
    return () => {
      mounted = false;
      clearInterval(interval)
    }
  }, [])

  const handleCompile = async () => {
    setIsCompiling(true)
    setCompileStatus('idle')
    setLogs(['Starting compilation...', `Target Board: ${detectedFqbn}`])
    
    try {
      const result = await compileProject(detectedFqbn)
      if (result.success) {
        setLogs((prev) => [...prev, 'Compilation successful!', result.message])
        setCompileStatus('success')
      } else {
        throw new Error('Compilation failed')
      }
    } catch (error: any) {
      setLogs((prev) => [...prev, `Error: ${error.message}`])
      setCompileStatus('error')
    } finally {
      setIsCompiling(false)
    }
  }

  const handleFlash = async () => {
    if (!arduinoConnected || !detectedPort) {
      setLogs((prev) => [...prev, 'Error: No board detected for flashing.'])
      setFlashStatus('error')
      return
    }

    if (compileStatus !== 'success') return
    
    setIsFlashing(true)
    setFlashStatus('idle')
    setLogs((prev) => [...prev, '', `Starting upload to ${detectedPort}...`])
    
    try {
      const result = await flashProject(detectedFqbn, detectedPort)
      if (result.success) {
        setLogs((prev) => [...prev, 'Upload successful!', result.message])
        setFlashStatus('success')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error: any) {
      setLogs((prev) => [...prev, `Error: ${error.message}`])
      setFlashStatus('error')
    } finally {
      setIsFlashing(false)
    }
  }

  const handleComplete = () => {
    if (flashStatus === 'success') {
      onComplete()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-foreground">Compile & Flash</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            {checkingArduino ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking...</span>
              </>
            ) : arduinoConnected ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">Arduino Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">No Arduino Found</span>
              </>
            )}
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {arduinoConnected 
            ? 'Your Arduino is connected. Review the code, compile it, and flash to your board.'
            : 'Connect your Arduino board to compile and flash code.'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Generated Code</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCompile}
                  disabled={isCompiling || !arduinoConnected}
                  className="bg-background text-foreground"
                >
                  {isCompiling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Compile
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleFlash}
                  disabled={compileStatus !== 'success' || isFlashing || !arduinoConnected}
                  className="bg-primary text-primary-foreground"
                >
                  {isFlashing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Flashing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Flash to Board
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card className="h-[420px] p-4 bg-muted/50 border-border overflow-auto font-mono text-sm">
              <pre className="text-foreground whitespace-pre-wrap break-words">{code}</pre>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="fqbn">Target Board (FQBN)</Label>
              <Input 
                id="fqbn" 
                value={detectedFqbn} 
                onChange={(e) => setDetectedFqbn(e.target.value)} 
                placeholder="e.g. arduino:avr:uno"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {arduinoConnected ? "Detected from board, but you can override." : "Manually enter if board not detected."}
              </p>
            </div>
          </div>

          {/* Compilation Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Compilation Output</h3>
              <div className="flex items-center gap-3">
                {compileStatus === 'success' && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Compiled</span>
                  </div>
                )}
                {compileStatus === 'error' && (
                  <div className="flex items-center gap-1 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error</span>
                  </div>
                )}
                {flashStatus === 'success' && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Flashed</span>
                  </div>
                )}
              </div>
            </div>

            <Card className="h-[500px] p-4 bg-muted/50 border-border overflow-auto">
              <div className="font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Terminal className="h-4 w-4" />
                    <span>{arduinoConnected ? 'Click Compile to start.' : 'Connect Arduino to compile.'}</span>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={log.includes('Error') || log.includes('error') ? 'text-destructive' : 'text-foreground'}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {!arduinoConnected && !checkingArduino && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-start gap-3">
                  <WifiOff className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-1">Arduino Not Connected</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      Please connect your Arduino board via USB cable to compile and flash code.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {flashStatus === 'success' && (
              <Card className="p-4 bg-success/10 border-success/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-success mb-1">Upload Successful!</h4>
                    <p className="text-sm text-foreground leading-relaxed mb-3">
                      Your code has been successfully uploaded to the board. The board should now be running your program.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleComplete}
                      className="bg-success text-white hover:bg-success/90"
                    >
                      Continue to Troubleshooting
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
