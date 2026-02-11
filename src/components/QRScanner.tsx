'use client'

import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    // Check camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false))
  }, [])

  const handleScan = (result: { rawValue: string }[]) => {
    if (result && result.length > 0 && isScanning) {
      setIsScanning(false)
      onScan(result[0].rawValue)
    }
  }

  const handleError = (error: unknown) => {
    console.error('QR Scanner error:', error)
    if (error instanceof Error) {
      onError?.(error)
    } else {
      onError?.(new Error(String(error)))
    }
  }

  if (hasPermission === null) {
    return (
      <div className="bg-gray-100 rounded-xl p-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Requesting camera access...</p>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="bg-red-50 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">📷</div>
        <p className="text-red-600 font-medium mb-2">Camera access denied</p>
        <p className="text-gray-600 text-sm">
          Please allow camera access to scan QR codes
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        constraints={{ facingMode: 'environment' }}
        styles={{
          container: { borderRadius: '12px' },
          video: { borderRadius: '12px' }
        }}
      />
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
          </div>
        </div>
      </div>
      {isScanning && (
        <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2">
          Point camera at QR code
        </p>
      )}
    </div>
  )
}
