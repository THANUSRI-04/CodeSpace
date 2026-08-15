import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Folder, FolderPlus, ArrowLeft, Trash2, FileCode2, Play, Search } from 'lucide-react';
import ProgramModal from '../components/ProgramModal';

const MyPrograms = () => {
    const [folders, setFolders] = useState([]);
    const [programs, setPrograms] = useState([]); // This holds either uncategorized OR folder-specific programs
    const [currentFolder, setCurrentFolder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);

    // Create Folder Modal state
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [createFolderLoading, setCreateFolderLoading] = useState(false);
    const [createFolderError, setCreateFolderError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        if (currentFolder) {
            fetchFolderPrograms(currentFolder.id);
        } else {
            fetchRootData();
        }
    }, [currentFolder]);

    const fetchRootData = async () => {
        setLoading(true);
        try {
            const [foldersRes, programsRes] = await Promise.all([
                axios.get('https://codespace-fb40.onrender.com/api/folders', { withCredentials: true }),
                axios.get('https://codespace-fb40.onrender.com/api/programs', { withCredentials: true })
            ]);
            setFolders(foldersRes.data.folders || []);
            setPrograms(programsRes.data.programs || []);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFolderPrograms = async (folderId) => {
        setLoading(true);
        try {
            const res = await axios.get(`https://codespace-fb40.onrender.com/folders/${folderId}/programs`, { withCredentials: true });
            setPrograms(res.data.programs || []);
        } catch (err) {
            setError('Failed to fetch folder contents');
            setCurrentFolder(null); // Go back if folder doesn't exist
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName || !newFolderName.trim()) {
            setCreateFolderError('Folder name cannot be empty');
            return;
        }

        setCreateFolderLoading(true);
        setCreateFolderError('');

        try {
            await axios.post('https://codespace-fb40.onrender.com/api/folders', { folder_name: newFolderName }, { withCredentials: true });
            setIsCreateFolderModalOpen(false);
            setNewFolderName('');
            fetchRootData();
        } catch (err) {
            setCreateFolderError(err.response?.data?.message || 'Failed to create folder');
        } finally {
            setCreateFolderLoading(false);
        }
    };

    const handleDeleteFolder = async (e, folderId) => {
        e.stopPropagation(); // prevent opening the folder
        if (!window.confirm('Are you sure you want to delete this folder? Programs inside will be moved to Uncategorized.')) return;

        try {
            await axios.delete(`https://codespace-fb40.onrender.com/api/folders/${folderId}`, { withCredentials: true });
            fetchRootData();
        } catch (err) {
            alert('Failed to delete folder');
        }
    };

    const handleDeleteProgram = async (e, id) => {
        e.stopPropagation(); // Prevent modal from opening
        if (!window.confirm('Are you sure you want to delete this program?')) return;

        try {
            await axios.delete(`https://codespace-fb40.onrender.com/api/programs/${id}`, { withCredentials: true });
            if (currentFolder) {
                fetchFolderPrograms(currentFolder.id);
            } else {
                fetchRootData();
            }
        } catch (err) {
            alert('Failed to delete program');
        }
    };

    const handleOpenProgram = (program) => {
        setSelectedProgram(program);
        setIsProgramModalOpen(true);
    };

    const handleProgramUpdate = () => {
        if (currentFolder) {
            fetchFolderPrograms(currentFolder.id);
        } else {
            fetchRootData();
        }
    };

    const handleEditProgram = (id) => {
        setIsProgramModalOpen(false);
        navigate(`/compiler?programId=${id}`);
    };

    const filteredFolders = folders.filter(f =>
        f.folder_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPrograms = programs.filter(p =>
        p.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && folders.length === 0 && programs.length === 0) return <div className="programs-container">Loading...</div>;
    if (error) return <div className="programs-container"><div style={{ color: 'var(--accent-danger)' }}>{error}</div></div>;

    return (
        <div className="programs-container">
            <div className="programs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, minWidth: '150px' }}>{currentFolder ? currentFolder.folder_name : 'My Programs'}</h2>

                <div style={{ position: 'relative', flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder={currentFolder ? "Search programs..." : "Search folders & programs..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '20px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', minWidth: '220px', justifyContent: 'flex-end' }}>
                    {!currentFolder && (
                        <button className="btn btn-secondary" onClick={() => {
                            setNewFolderName('');
                            setCreateFolderError('');
                            setIsCreateFolderModalOpen(true);
                        }}>
                            <FolderPlus size={16} /> New Folder
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => navigate('/compiler')}>
                        <FileCode2 size={16} /> New Program
                    </button>
                </div>
            </div>

            {currentFolder && (
                <button className="back-btn" onClick={() => { setCurrentFolder(null); setSearchQuery(''); }} style={{ marginBottom: '2rem' }}>
                    <ArrowLeft size={16} /> My Programs
                </button>
            )}

            {!currentFolder && filteredFolders.length > 0 && (
                <>
                    <h3 className="section-title">Folders</h3>
                    <div className="folder-list">
                        {filteredFolders.map(folder => (
                            <div key={folder.id} className="folder-card" onClick={() => { setCurrentFolder(folder); setSearchQuery(''); }}>
                                <div className="folder-info">
                                    <Folder className="folder-icon" size={24} />
                                    <div>
                                        <div className="folder-name">{folder.folder_name}</div>
                                        <div className="folder-count">{folder.program_count || 0} programs</div>
                                    </div>
                                </div>
                                <button
                                    className="icon-btn"
                                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                                    title="Delete Folder"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <h3 className="section-title">{currentFolder ? 'Programs' : 'Uncategorized Programs'}</h3>

            {filteredPrograms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No programs found.
                </div>
            ) : (
                <div className="programs-list">
                    {filteredPrograms.map(program => (
                        <div key={program.id} className="program-card">
                            <div className="program-info">
                                <h3>{program.program_name}</h3>
                                <div className="program-meta">
                                    <span className="program-lang">{program.language}</span>
                                    <span>Saved {new Date(program.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="program-actions">
                                <button className="btn btn-secondary" onClick={() => handleOpenProgram(program)}>
                                    Open
                                </button>
                                <button className="btn btn-danger" onClick={(e) => handleDeleteProgram(e, program.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isProgramModalOpen && selectedProgram && (
                <ProgramModal
                    program={selectedProgram}
                    onClose={() => {
                        setIsProgramModalOpen(false);
                        setSelectedProgram(null);
                    }}
                    onEdit={handleEditProgram}
                    onUpdate={handleProgramUpdate}
                />
            )}

            {isCreateFolderModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Create New Folder</h3>
                        {createFolderError && (
                            <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                {createFolderError}
                            </div>
                        )}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Folder Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                autoFocus
                                placeholder="e.g. Algorithms"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setIsCreateFolderModalOpen(false)} disabled={createFolderLoading}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateFolder} disabled={createFolderLoading}>
                                {createFolderLoading ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPrograms;
