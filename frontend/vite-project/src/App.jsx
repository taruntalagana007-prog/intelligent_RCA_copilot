import { useRef, useState } from 'react'

import Header from './components/Header'
import ChatArea from './components/ChatArea'
import InputArea from './components/InputArea'

import './App.css'


function App() {

  const fileInputRef = useRef(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
 
const [chatMessages, setChatMessages] = useState([])

const [isChatLoading, setIsChatLoading] = useState(false)

  const [status, setStatus] = useState({
    parsing: false,
    searching: false,
    rca: false,
    report: false,
    completed: false
  })

  const [result, setResult] = useState(null)

  const [sessionId, setSessionId] = useState(null)

  const [isDragging, setIsDragging] = useState(false)

  const [isUploading, setIsUploading] = useState(false)

  const [uploadProgress, setUploadProgress] = useState(0)

  const [selectedFile, setSelectedFile] = useState(null)


  // ============================================================
  // OPEN FILE BROWSER
  // ============================================================

  const handleBrowse = () => {

    fileInputRef.current?.click()

  }


  // ============================================================
  // FILE SELECTED
  // ============================================================

  const handleFileChange = (event) => {

    const file = event.target.files[0]

    if (!file) {
      return
    }

    processFile(file)

  }


  // ============================================================
  // DRAG OVER
  // ============================================================

  const handleDragOver = (event) => {

    event.preventDefault()

    setIsDragging(true)

  }


  // ============================================================
  // DRAG LEAVE
  // ============================================================

  const handleDragLeave = (event) => {

    event.preventDefault()

    setIsDragging(false)

  }


  // ============================================================
  // DROP
  // ============================================================

  const handleDrop = (event) => {

    event.preventDefault()

    setIsDragging(false)

    const file = event.dataTransfer.files[0]

    if (!file) {
      return
    }

    processFile(file)

  }


  // ============================================================
  // PROCESS FILE
  // ============================================================

  const processFile = async (file) => {

    if (!file.name.toLowerCase().endsWith('.log')) {

      alert('Please upload a .log file.')

      return

    }


    setSelectedFile(file)

    setIsUploading(true)

    setUploadProgress(5)

    setResult(null)

    setSessionId(null)


    setStatus({
      parsing: false,
      searching: false,
      rca: false,
      report: false,
      completed: false
    })


    const formData = new FormData()

    formData.append('file', file)


    try {

      console.log('Starting upload...')


      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/analyze/stream',
        {
          method: 'POST',
          body: formData
        }
      )


      console.log(
        'Response received:',
        response.status
      )


      if (!response.ok) {

        throw new Error(
          `Upload failed: ${response.status}`
        )

      }


      if (!response.body) {

        throw new Error(
          'Streaming response body is not available.'
        )

      }


      const reader = response.body.getReader()

      const decoder = new TextDecoder('utf-8')


      let buffer = ''

      let finalAnswer = ''


      // ========================================================
      // READ STREAM
      // ========================================================

      while (true) {

        const { value, done } = await reader.read()


        if (done) {

          console.log('Stream finished.')

          break

        }


        const chunk = decoder.decode(
          value,
          {
            stream: true
          }
        )


        console.log(
          'STREAM CHUNK:',
          chunk
        )


        buffer += chunk


        // ------------------------------------------------------
        // SSE events are separated by a blank line
        // ------------------------------------------------------

        const events = buffer.split(/\r?\n\r?\n/)


        buffer = events.pop() || ''


        // ======================================================
        // PROCESS EVENTS
        // ======================================================

        for (const event of events) {

          if (!event.trim()) {
            continue
          }


          console.log(
            'SSE EVENT:',
            event
          )


          const lines = event.split(/\r?\n/)


          let eventType = ''

          const dataLines = []


          // ----------------------------------------------------
          // Read every SSE line
          // ----------------------------------------------------

          for (const line of lines) {

            if (line.startsWith('event:')) {

              eventType = line
                .substring(6)
                .trim()

            }


            else if (line.startsWith('data:')) {

              dataLines.push(
                line.substring(5).trim()
              )

            }

          }


          // ----------------------------------------------------
          // Reconstruct multiline data
          // ----------------------------------------------------

          const data = dataLines.join('\n')


          console.log(
            'EVENT TYPE:',
            eventType
          )

          console.log(
            'EVENT DATA:',
            data
          )


          // ====================================================
          // SESSION
          // ====================================================

          if (eventType === 'session') {

            console.log(
              'SESSION ID:',
              data
            )


            setSessionId(data)

          }


          // ====================================================
          // STAGE
          // ====================================================

          else if (eventType === 'stage') {

            console.log(
              'STAGE:',
              data
            )


            if (data === 'parsing') {

              setStatus({
                parsing: true,
                searching: false,
                rca: false,
                report: false,
                completed: false
              })

              setUploadProgress(25)

            }


            else if (data === 'searching') {

              setStatus({
                parsing: true,
                searching: true,
                rca: false,
                report: false,
                completed: false
              })

              setUploadProgress(50)

            }


            else if (data === 'report') {

              setStatus({
                parsing: true,
                searching: true,
                rca: true,
                report: true,
                completed: false
              })

              setUploadProgress(75)

            }

          }


          // ====================================================
          // TOOL CALL
          // ====================================================

          else if (eventType === 'tool_call') {

            console.log(
              'TOOL CALL:',
              data
            )

          }


          // ====================================================
          // TOOL RESULT
          // ====================================================

          else if (eventType === 'tool_result') {

            console.log(
              'TOOL RESULT:',
              data
            )

          }


          // ====================================================
          // FINAL ANSWER
          // ====================================================

          else if (eventType === 'final_answer') {

            console.log(
              'FINAL ANSWER RECEIVED'
            )


            finalAnswer = data


            setStatus({
              parsing: true,
              searching: true,
              rca: true,
              report: true,
              completed: true
            })


            setUploadProgress(100)

          }

        }

      }


      // ========================================================
      // PROCESS FINAL RESULT
      // ========================================================

      console.log(
        'FINAL ANSWER:',
        finalAnswer
      )


      if (!finalAnswer) {

        throw new Error(
          'No final answer received from backend.'
        )

      }


      try {

        const parsedResult = JSON.parse(
          finalAnswer
        )


        console.log(
          'PARSED RCA RESULT:',
          parsedResult
        )


        setResult(parsedResult)

      }

      catch (error) {

        console.error(
          'JSON parsing failed:',
          error
        )


        console.error(
          'Raw final answer:',
          finalAnswer
        )


        alert(
          'The RCA result was received but could not be parsed.'
        )

      }

    }


    catch (error) {

      console.error(
        'Upload error:',
        error
      )


      alert(
        `Failed to analyze the HIL log: ${error.message}`
      )

    }


    finally {

      setIsUploading(false)

    }

  }




  const handleChatSend = async (message) => {

  if (!message.trim()) {
    return
  }

  if (!sessionId) {
    alert('Please upload and analyze a HIL log first.')
    return
  }

  const userMessage = {
    role: 'user',
    text: message
  }

  setChatMessages((previous) => [
    ...previous,
    userMessage
  ])

  setIsChatLoading(true)

  try {

    const response = await fetch(
      'http://127.0.0.1:8000/chat',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          message: message,
          user_id: 'test_user',
          session_id: sessionId
        })
      }
    )

    if (!response.ok) {

      throw new Error(
        `Chat request failed: ${response.status}`
      )

    }

    const data = await response.json()

    setChatMessages((previous) => [
      ...previous,
      {
        role: 'assistant',
        text: data.response
      }
    ])

  }

  catch (error) {

    console.error(
      'Chat error:',
      error
    )

    setChatMessages((previous) => [
      ...previous,
      {
        role: 'assistant',
        text: 'Unable to get a response. Please try again.'
      }
    ])

  }

  finally {

    setIsChatLoading(false)

  }
}

  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="app">

      <Header />


      <input
        ref={fileInputRef}
        type="file"
        accept=".log"
        onChange={handleFileChange}
        style={{
          display: 'none'
        }}
      />


      <ChatArea
  status={status}
  result={result}
  isDragging={isDragging}
  isUploading={isUploading}
  uploadProgress={uploadProgress}
  selectedFile={selectedFile}
  handleDragOver={handleDragOver}
  handleDragLeave={handleDragLeave}
  handleDrop={handleDrop}
  handleBrowse={handleBrowse}

  sessionId={sessionId}

  isChatOpen={isChatOpen}
  setIsChatOpen={setIsChatOpen}

  chatMessages={chatMessages}
  handleChatSend={handleChatSend}
  isChatLoading={isChatLoading}
/>


      <InputArea
        isUploading={isUploading}
        selectedFile={selectedFile}
        handleBrowse={handleBrowse}
        sessionId={sessionId}
        setSessionId={setSessionId}
      />

    </div>

  )

}


export default App