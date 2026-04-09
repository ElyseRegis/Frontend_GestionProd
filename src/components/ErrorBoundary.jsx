import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '100px auto',
                    background: '#fee2e2',
                    borderRadius: '16px',
                    border: '1px solid #ef4444'
                }}>
                    <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
                        <i className="fas fa-exclamation-triangle"></i> Une erreur est survenue
                    </h2>
                    <p style={{ color: '#991b1b', marginBottom: '20px' }}>
                        {this.state.error?.message || 'Erreur inattendue'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-redo"></i> Recharger la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
