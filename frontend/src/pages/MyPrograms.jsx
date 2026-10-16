import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config';
import { Folder, FolderPlus, ArrowLeft, Trash2, FileCode2, Search } from 'lucide-react';
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
                api.get('/api/folders'),
                api.get('/api/programs')
            ]);
            setFolders(foldersRes.data.folders || []);
            setPrograms(programsRes.data.programs || []);
        } catch {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchFolderPrograms = async (folderId) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/folders/${folderId}/programs`);
            setPrograms(res.data.programs || []);
        } catch {
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
            await api.post('/api/folders', { folder_name: newFolderName });
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
            await api.delete(`/api/folders/${folderId}`);
            fetchRootData();
        } catch {
            alert('Failed to delete folder');
        }
    };

    const handleDeleteProgram = async (e, id) => {
        e.stopPropagation(); // Prevent modal from opening
        if (!window.confirm('Are you sure you want to delete this program?')) return;

        try {
            await api.delete(`/api/programs/${id}`);
            if (currentFolder) {
                fetchFolderPrograms(currentFolder.id);
            } else {
                fetchRootData();
            }
        } catch {
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

    if (loading && folders.length === 0 && programs.length === 0) {
        return (
            <div className="programs-container">
                <div className="programs-loading-state">
                    <div className="loading-spinner" />
                    <span>Loading your programs & folders...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="programs-container">
                <div className="programs-error-state">
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={fetchRootData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="programs-container">
            {/* Responsive Header */}
            <div className="programs-header-bar">
                <div className="programs-header-left">
                    <h1 className="programs-main-title">
                        {currentFolder ? currentFolder.folder_name : 'My Programs'}
                    </h1>
                </div>

                <div className="programs-search-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder={currentFolder ? "Search programs..." : "Search folders & programs..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search"
                    />
                </div>

                <div className="programs-header-actions">
                    {!currentFolder && (
                        <button className="btn btn-secondary btn-header-action" onClick={() => {
                            setNewFolderName('');
                            setCreateFolderError('');
                            setIsCreateFolderModalOpen(true);
                        }}>
                            <FolderPlus size={16} />
                            <span>New Folder</span>
                        </button>
                    )}
                    <button className="btn btn-primary btn-header-action" onClick={() => navigate('/compiler')}>
                        <FileCode2 size={16} />
                        <span>New Program</span>
                    </button>
                </div>
            </div>

            {currentFolder && (
                <button className="back-btn" onClick={() => { setCurrentFolder(null); setSearchQuery(''); }}>
                    <ArrowLeft size={16} />
                    <span>Back to All Programs</span>
                </button>
            )}

            {/* Folders Section */}
            {!currentFolder && filteredFolders.length > 0 && (
                <section className="programs-section" aria-label="Folders">
                    <h2 className="section-title">Folders ({filteredFolders.length})</h2>
                    <div className="folder-list">
                        {filteredFolders.map(folder => (
                            <div key={folder.id} className="folder-card" onClick={() => { setCurrentFolder(folder); setSearchQuery(''); }}>
                                <div className="folder-info">
                                    <Folder className="folder-icon" size={24} />
                                    <div className="folder-text-group">
                                        <div className="folder-name" title={folder.folder_name}>{folder.folder_name}</div>
                                        <div className="folder-count">{folder.program_count || 0} programs</div>
                                    </div>
                                </div>
                                <button
                                    className="icon-btn delete-folder-btn"
                                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                                    title="Delete Folder"
                                    aria-label="Delete Folder"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Programs Section */}
            <section className="programs-section" aria-label="Programs">
                <h2 className="section-title">
                    {currentFolder ? 'Programs in this folder' : 'Uncategorized Programs'}
                </h2>

                {filteredPrograms.length === 0 ? (
                    <div className="programs-empty-card">
                        <FileCode2 size={40} className="empty-icon" />
                        <h3>No programs found</h3>
                        <p>
                            {searchQuery 
                                ? 'No programs or folders match your search query.' 
                                : 'You have not saved any programs in this section yet.'}
                        </p>
                        <button className="btn btn-primary" onClick={() => navigate('/compiler')}>
                            Create New Program
                        </button>
                    </div>
                ) : (
                    <div className="programs-list">
                        {filteredPrograms.map(program => (
                            <div key={program.id} className="program-card">
                                <div className="program-info">
                                    <h3 title={program.program_name}>{program.program_name}</h3>
                                    <div className="program-meta">
                                        <span className="program-lang">{program.language.toUpperCase()}</span>
                                        <span className="program-date">
                                            Saved {new Date(program.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="program-actions">
                                    <button className="btn btn-secondary btn-action" onClick={() => handleOpenProgram(program)}>
                                        Open
                                    </button>
                                    <button className="btn btn-danger btn-action" onClick={(e) => handleDeleteProgram(e, program.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

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
                <div className="modal-overlay" onClick={() => setIsCreateFolderModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Create New Folder</h3>
                        {createFolderError && (
                            <div className="form-error-alert">
                                {createFolderError}
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="newFolderName">Folder Name</label>
                            <input
                                id="newFolderName"
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
