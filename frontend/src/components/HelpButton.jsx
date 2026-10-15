import React, { useState } from 'react';
import { MessageCircle, Mail, X } from 'lucide-react';

const HelpButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <aside className="help-button-container" aria-label="Support and Contact">
            {isOpen && (
                <div className="help-popover" role="dialog" aria-label="Support information">
                    <div className="help-popover-header">
                        <h4 className="help-title">Need Help?</h4>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="icon-btn-compact" 
                            aria-label="Close help popover"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="help-popover-body">
                        <p className="help-text">Facing any queries or issues? Reach out directly:</p>
                        <a 
                            href="mailto:thanusrimareboina@gmail.com" 
                            className="help-email-link"
                            title="Send email"
                        >
                            <Mail size={15} />
                            <span className="email-address">thanusrimareboina@gmail.com</span>
                        </a>
                    </div>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="help-trigger-btn"
                aria-label={isOpen ? "Close support menu" : "Open support menu"}
                aria-expanded={isOpen}
                title="Need Help?"
            >
                <MessageCircle size={22} />
            </button>
        </aside>
    );
};

export default HelpButton;
