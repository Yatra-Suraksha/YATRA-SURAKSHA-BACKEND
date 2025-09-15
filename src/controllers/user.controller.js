export const verifyToken = async (req, res) => {
    try {
        // Check if user data exists (from middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No user data found. Token may be invalid or missing.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;

        res.status(200).json({
            success: true,
            message: 'Token verified successfully',
            data: {
                user: {
                    uid,
                    email,
                    name,
                    picture,
                    emailVerified,
                    tokenValid: true
                }
            }
        });
    } catch (error) {
        console.error('Error in verifyToken:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


export const getCurrentUser = async (req, res) => {
    try {
        // Check if user data exists (from middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No user data found. Please authenticate first.',
                error: 'UNAUTHORIZED'
            });
        }

        const { uid, email, name, picture, emailVerified } = req.user;

        res.status(200).json({
            success: true,
            message: 'User info retrieved from token',
            data: {
                user: {
                    uid,
                    email,
                    name,
                    picture,
                    emailVerified,
                    source: 'firebase_token'
                }
            }
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

