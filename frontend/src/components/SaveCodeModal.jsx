import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderPlus } from 'lucide-react';

const SaveCodeModal = ({ isOpen, onClose, onSave, defaultName, language, isEditMode }) => {
    const [name, setName] = useState('');
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');

    // Inline folder creation
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(defaultName || '');
            fetchFolders();
            setIsCreatingFolder(false);
            setNewFolderName('');
            setError('');
        }
    }, [isOpen, defaultName]);

    const fetchFolders = async () => {
        try {
            const res = await axios.get('https://codespace-1-g2fn.onrender.com/api/folders');
            setFolders(res.data.folders || []);
        } catch (err) {
            console.error('Failed to fetch folders', err);
        }
    };

    if (!isOpen) return null;

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setCreatingFolderLoading(true);
        try {
            const res = await axios.post('https://codespace-1-g2fn.onrender.com/api/folders', { folder_name: newFolderName });
            const newFolder = { id: res.data.folderId, folder_name: newFolderName };
            setFolders([newFolder, ...folders]);
            setSelectedFolderId(res.data.folderId);
            setIsCreatingFolder(false);
            setNewFolderName('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create folder');
        } finally {
            setCreatingFolderLoading(false);
        }
    };

    const handleSave = async (isUpdate = false) => {
        if (!name.trim()) {
            setError('Program name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSave(name, isUpdate, selectedFolderId || null);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save program');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header-simple">
                    <h3>Save Program</h3>
                </div>

                {error && <div className="form-error-alert">{error}</div>}

                <div className="form-group">
                    <label htmlFor="programNameInput">Program Name</label>
                    <input
                        id="programNameInput"
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        placeholder="e.g. Binary Search"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="folderSelect">Folder (Optional)</label>
                    <select
                        id="folderSelect"
                        className="form-control"
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                    >
                        <option value="">-- No Folder (Uncategorized) --</option>
                        {folders.map(f => (
                            <option key={f.id} value={f.id}>📁 {f.folder_name}</option>
                        ))}
                    </select>
                </div>

                {!isCreatingFolder ? (
                    <button
                        className="btn-text-link"
                        onClick={() => setIsCreatingFolder(true)}
                    >
                        <FolderPlus size={15} /> <span>Create New Folder</span>
                    </button>
                ) : (
                    <div className="inline-folder-creator">
                        <input
                            type="text"
                            className="form-control"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="New Folder Name"
                            autoFocus
                        />
                        <div className="inline-creator-buttons">
                            <button className="btn btn-secondary" onClick={() => setIsCreatingFolder(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateFolder} disabled={creatingFolderLoading}>
                                {creatingFolderLoading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-language-badge">
                    <span>Language:</span> <strong>{language}</strong>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    {isEditMode ? (
                        <>
                            <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading}>
                                {loading ? 'Saving...' : 'Save as New'}
                            </button>
                            <button className="btn btn-success" onClick={() => handleSave(true)} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Program'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Program'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaveCodeModal;
