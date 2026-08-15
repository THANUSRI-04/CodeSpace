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
            const res = await axios.get('https://codespace-fb40.onrender.com/api/folders');
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
            const res = await axios.post('https://codespace-fb40.onrender.com/api/folders', { folder_name: newFolderName });
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Save Program</h3>

                {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>{error}</div>}

                <div className="form-group">
                    <label>Program Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        placeholder="e.g. Binary Search"
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Folder</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
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
                </div>

                {!isCreatingFolder ? (
                    <button
                        className="btn"
                        style={{ background: 'transparent', color: 'var(--accent-primary)', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => setIsCreatingFolder(true)}
                    >
                        <FolderPlus size={16} /> Create New Folder
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            className="form-control"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder Name"
                        />
                        <button className="btn btn-secondary" onClick={() => setIsCreatingFolder(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCreateFolder} disabled={creatingFolderLoading}>Create</button>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Language: <span style={{ color: 'var(--text-primary)' }}>{language}</span>
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
