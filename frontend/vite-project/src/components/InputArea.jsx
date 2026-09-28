function InputArea({
  isUploading,
  selectedFile,
  handleBrowse
}) {

  return (
    <div className="input-area">

      <div className="input-status">

        {selectedFile ? (
          <>
            <span className="file-status-dot"></span>

            <span className="file-name">
              {selectedFile.name}
            </span>

            {isUploading && (
              <span className="analyzing-text">
                Analyzing...
              </span>
            )}
          </>
        ) : (
          <span className="input-hint">
            Upload a HIL log to begin investigation
          </span>
        )}

      </div>


      <button
        className="upload-button"
        onClick={handleBrowse}
        disabled={isUploading}
      >
        {isUploading
          ? 'Analyzing...'
          : '📎 Browse Log'}
      </button>

    </div>
  )
}

export default InputArea