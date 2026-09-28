import { useState } from 'react'
import { jsPDF } from 'jspdf'

function ChatArea({
  status,
  result,
  isDragging,
  isUploading,
  uploadProgress,
  selectedFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleBrowse,

  sessionId,

  isChatOpen,
  setIsChatOpen,

  chatMessages,
  handleChatSend,
  isChatLoading
}) {


function downloadPDF(result) {

  const report = result.eight_d_report

  const pdf = new jsPDF()

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 20
  const contentWidth = pageWidth - margin * 2

  let y = 20

  const addText = (text, fontSize = 11, bold = false) => {

    pdf.setFontSize(fontSize)

    pdf.setFont(
      'helvetica',
      bold ? 'bold' : 'normal'
    )

    const lines = pdf.splitTextToSize(
      String(text || ''),
      contentWidth
    )

    const lineHeight = fontSize * 0.5 + 3

    if (y + lines.length * lineHeight > pageHeight - 20) {
      pdf.addPage()
      y = 20
    }

    pdf.text(lines, margin, y)

    y += lines.length * lineHeight + 5
  }

  const addHeading = (text) => {

    if (y > pageHeight - 35) {
      pdf.addPage()
      y = 20
    }

    pdf.setFontSize(14)

    pdf.setFont(
      'helvetica',
      'bold'
    )

    pdf.text(text, margin, y)

    y += 9
  }

  // Title

  pdf.setFontSize(20)

  pdf.setFont(
    'helvetica',
    'bold'
  )

  pdf.text(
    'Intelligent RCA Copilot',
    margin,
    y
  )

  y += 10

  pdf.setFontSize(16)

  pdf.text(
    '8D Report',
    margin,
    y
  )

  y += 15

  // RCA Findings

  addHeading('RCA Findings')

  addHeading('Failure')
  addText(result.failure)

  addHeading('Root Cause')
  addText(result.root_cause)

  addHeading('Evidence')

  if (result.evidence) {

    result.evidence.forEach((item) => {
      addText(`• ${item}`)
    })
  }

  addHeading('Historical Reference')
  addText(result.historical_reference)

  addHeading('Recommended Resolution')
  addText(result.recommended_resolution)

  // 8D Report

  addHeading('8D Report')

  addHeading('D1 — Team')
  addText(report.d1_team)

  addHeading('D2 — Problem Description')
  addText(report.d2_problem_description)

  addHeading('D3 — Containment')
  addText(report.d3_containment)

  addHeading('D4 — Root Cause Analysis')
  addText(report.d4_root_cause_analysis)

  addHeading('D5 — Corrective Action')
  addText(report.d5_corrective_action)

  addHeading('D6 — Corrective Action Validation')
  addText(report.d6_corrective_action_validation)

  addHeading('D7 — Prevent Recurrence')
  addText(report.d7_prevent_recurrence)

  addHeading('D8 — Closure')
  addText(report.d8_closure)

  // Footer with page numbers

  const totalPages =
    pdf.internal.getNumberOfPages()

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    pdf.setPage(page)

    pdf.setFontSize(9)

    pdf.setFont(
      'helvetica',
      'normal'
    )

    pdf.text(
      `RCA Copilot — Page ${page} of ${totalPages}`,
      margin,
      pageHeight - 10
    )
  }

  pdf.save('RCA_8D_Report.pdf')
}

function downloadMarkdown(result) {

  const report = result.eight_d_report

  const markdown = `# 8D Report

## D1 — Team

${report.d1_team}

## D2 — Problem Description

${report.d2_problem_description}

## D3 — Containment

${report.d3_containment}

## D4 — Root Cause Analysis

${report.d4_root_cause_analysis}

## D5 — Corrective Action

${report.d5_corrective_action}

## D6 — Corrective Action Validation

${report.d6_corrective_action_validation}

## D7 — Prevent Recurrence

${report.d7_prevent_recurrence}

## D8 — Closure

${report.d8_closure}

---

# RCA Findings

## Failure

${result.failure}

## Root Cause

${result.root_cause}

## Evidence

${result.evidence
  .map((item) => `- ${item}`)
  .join('\n')}

## Historical Reference

${result.historical_reference}

## Recommended Resolution

${result.recommended_resolution}
`

  const blob = new Blob(
    [markdown],
    {
      type: 'text/markdown;charset=utf-8'
    }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url

  link.download = 'RCA_8D_Report.md'

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

  return (

    <div className="chat-area">

      {/* ==========================================
          UPLOAD AREA
          ========================================== */}

      {!status.parsing &&
        !status.searching &&
        !status.rca &&
        !status.report && (

          <div className="dashboard">

            <div className="dashboard-title">

              <h2>HIL Log Analysis</h2>

              <p>
                Upload a HIL test log to start an automated
                root cause investigation.
              </p>

            </div>


            {/* ======================================
                DRAG & DROP
                ====================================== */}

            <div
              className={`drop-zone ${
                isDragging ? 'dragging' : ''
              }`}

              onDragOver={handleDragOver}

              onDragLeave={handleDragLeave}

              onDrop={handleDrop}

              onClick={
                !isUploading
                  ? handleBrowse
                  : undefined
              }
            >

              {isUploading ? (

                <>
                  <div className="drop-icon analyzing-icon">
                    ⟳
                  </div>

                  <h3>
                    Analyzing HIL Log
                  </h3>

                  <p>
                    {selectedFile?.name}
                  </p>

                  <div className="center-progress">

                    <div
                      className="center-progress-bar"
                      style={{
                        width: `${uploadProgress}%`
                      }}
                    />

                  </div>

                  <span>
                    {uploadProgress}% complete
                  </span>
                </>

              ) : (

                <>

                  <div className="drop-icon">
                    ↓
                  </div>

                  <h3>
                    {isDragging
                      ? 'Drop HIL log here'
                      : 'Drag & Drop HIL Log'}
                  </h3>

                  <p>
                    Drop your HIL test log here or
                    click to browse
                  </p>

                  <span>
                    Supports .log files
                  </span>

                </>

              )}

            </div>

          </div>

        )}


      {/* ==========================================
          INVESTIGATION
          ========================================== */}

      {(status.parsing ||
        status.searching ||
        status.rca ||
        status.report) && (

        <div className="investigation">

          {/* ======================================
              INVESTIGATION HEADER
              ====================================== */}

          <div className="investigation-header">

            <div>

              <h2>
                HIL Investigation
              </h2>

              <p>
                Automated failure analysis in progress
              </p>

            </div>


            {status.completed && (

              <div className="investigation-complete">
                ✓ Complete
              </div>

            )}

          </div>


          {/* ======================================
              TIMELINE
              ====================================== */}

          <div className="timeline">


            {/* --------------------------------------
                PARSING
                -------------------------------------- */}

            <div
              className={`timeline-item ${
                status.parsing ? 'active' : ''
              }`}
            >

              <div className="timeline-marker">

                {status.parsing
                  ? '✓'
                  : '○'}

              </div>


              <div className="timeline-content">

                <strong>
                  Parsing Logs
                </strong>

                <span>
                  Extracting ECU errors, warnings
                  and failure sequence
                </span>

              </div>

            </div>


            {/* --------------------------------------
                RAG
                -------------------------------------- */}

            <div
              className={`timeline-item ${
                status.searching ? 'active' : ''
              }`}
            >

              <div className="timeline-marker">

                {status.searching
                  ? '✓'
                  : '○'}

              </div>


              <div className="timeline-content">

                <strong>
                  Searching Prior Fixes
                </strong>

                <span>
                  Comparing the failure with
                  historical engineering incidents
                </span>

              </div>

            </div>


            {/* --------------------------------------
                RCA
                -------------------------------------- */}

            <div
              className={`timeline-item ${
                status.rca ? 'active' : ''
              }`}
            >

              <div className="timeline-marker">

                {status.rca
                  ? '✓'
                  : '○'}

              </div>


              <div className="timeline-content">

                <strong>
                  Root Cause Analysis
                </strong>

                <span>
                  Correlating current evidence with
                  historical findings
                </span>

              </div>

            </div>


            {/* --------------------------------------
                8D
                -------------------------------------- */}

            <div
              className={`timeline-item ${
                status.report ? 'active' : ''
              }`}
            >

              <div className="timeline-marker">

                {status.report
                  ? '✓'
                  : '○'}

              </div>


              <div className="timeline-content">

                <strong>
                  Generating 8D Report
                </strong>

                <span>
                  Preparing structured corrective
                  action report
                </span>

              </div>

            </div>

          </div>


          {/* ======================================
              RCA RESULT
              ====================================== */}

          {result && (

            <div className="result-area">

              <h3>
                Investigation Findings
              </h3>


              {/* FAILURE */}

              <div className="result-section">

                <h4>
                  Failure
                </h4>

                <p>
                  {result.failure}
                </p>

              </div>


              {/* ROOT CAUSE */}

              <div className="result-section">

                <h4>
                  Root Cause
                </h4>

                <p>
                  {result.root_cause}
                </p>

              </div>


              {/* EVIDENCE */}

              <div className="result-section">

                <h4>
                  Evidence
                </h4>

                <ul>

                  {result.evidence?.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              </div>


              {/* HISTORICAL REFERENCE */}

              <div className="result-section">

                <h4>
                  Historical Reference
                </h4>

                <p>
                  {result.historical_reference}
                </p>

              </div>


              {/* RECOMMENDED RESOLUTION */}

              <div className="result-section">

                <h4>
                  Recommended Resolution
                </h4>

                <p>
                  {result.recommended_resolution}
                </p>

              </div>


              {/* ==================================
                  8D REPORT
                  ================================== */}

              {result.eight_d_report && (

                <div className="result-section">

                  <h4>
                    8D Report
                  </h4>
                
                <div className="report-actions">

  <button
    className="report-download-button"
    onClick={() => downloadMarkdown(result)}
  >
    ↓ Download Markdown
  </button>

  <button
    className="report-download-button"
    onClick={() => downloadPDF(result)}
  >
    ↓ Download PDF
  </button>

</div>

                  <div className="eight-d-preview">

                    <p>
                      <strong>
                        D1 — Team
                      </strong>
                    </p>

                    <p>
                      {result.eight_d_report.d1_team}
                    </p>


                    <p>
                      <strong>
                        D2 — Problem Description
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d2_problem_description
                      }
                    </p>


                    <p>
                      <strong>
                        D3 — Containment
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d3_containment
                      }
                    </p>


                    <p>
                      <strong>
                        D4 — Root Cause Analysis
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d4_root_cause_analysis
                      }
                    </p>


                    <p>
                      <strong>
                        D5 — Corrective Action
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d5_corrective_action
                      }
                    </p>


                    <p>
                      <strong>
                        D6 — Corrective Action Validation
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d6_corrective_action_validation
                      }
                    </p>


                    <p>
                      <strong>
                        D7 — Prevent Recurrence
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d7_prevent_recurrence
                      }
                    </p>


                    <p>
                      <strong>
                        D8 — Closure
                      </strong>
                    </p>

                    <p>
                      {
                        result.eight_d_report
                          .d8_closure
                      }
                    </p>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>

      )}


      {/* ==========================================
          FLOATING CHAT BUTTON
          ========================================== */}

      <button
        className="floating-chat-button"
        onClick={() => setIsChatOpen(true)}
      >

        💬

        <span>
          Chat
        </span>

      </button>


      {/* ==========================================
          CHAT POPUP
          ========================================== */}

      {isChatOpen && (

        <ChatPopup
          sessionId={sessionId}
          chatMessages={chatMessages}
          handleChatSend={handleChatSend}
          isChatLoading={isChatLoading}
          onClose={() => setIsChatOpen(false)}
        />

      )}

    </div>

  )

}


/* ============================================================
   CHAT POPUP
   ============================================================ */

function ChatPopup({
  sessionId,
  chatMessages,
  handleChatSend,
  isChatLoading,
  onClose
}) {

  const [message, setMessage] = useState('')


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSubmit = (event) => {

    event.preventDefault()

    if (!message.trim()) {
      return
    }

    if (!sessionId) {
      return
    }

    if (isChatLoading) {
      return
    }

    handleChatSend(message)

    setMessage('')

  }


  return (

    <div className="chat-popup">


      {/* ======================================
          HEADER
          ====================================== */}

      <div className="chat-popup-header">

        <div>

          <strong>
            RCA Copilot
          </strong>

          <span>
            {sessionId
              ? 'Investigation connected'
              : 'No investigation session'}
          </span>

        </div>


        <button
          className="chat-close-button"
          onClick={onClose}
        >
          ×
        </button>

      </div>


      {/* ======================================
          MESSAGES
          ====================================== */}

      <div className="chat-popup-messages">

        {chatMessages.length === 0 && (

          <div className="chat-empty">

            <div className="chat-empty-icon">
              💬
            </div>

            <h3>
              Ask about this investigation
            </h3>

            <p>
              Ask questions about the uploaded
              HIL log, root cause, evidence,
              or recommended resolution.
            </p>

          </div>

        )}


        {chatMessages.map(
          (chatMessage, index) => (

            <div
              key={index}
              className={`chat-message ${
                chatMessage.role
              }`}
            >

              <div className="chat-message-label">

                {chatMessage.role === 'user'
                  ? 'You'
                  : 'RCA Copilot'}

              </div>


              <div className="chat-message-text">

                {chatMessage.text}

              </div>

            </div>

          )
        )}


        {isChatLoading && (

          <div className="chat-message assistant">

            <div className="chat-message-label">
              RCA Copilot
            </div>

            <div className="chat-typing">
              Analyzing...
            </div>

          </div>

        )}

      </div>


      {/* ======================================
          INPUT
          ====================================== */}

      <form
        className="chat-popup-input"
        onSubmit={handleSubmit}
      >

        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder={
            sessionId
              ? 'Ask about this investigation...'
              : 'Upload a HIL log first...'
          }
          disabled={
            !sessionId ||
            isChatLoading
          }
        />


        <button
          type="submit"
          disabled={
            !sessionId ||
            isChatLoading ||
            !message.trim()
          }
        >
          →
        </button>

      </form>

    </div>

  )

}


export default ChatArea