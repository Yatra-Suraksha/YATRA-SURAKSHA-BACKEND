/**
 * @swagger
 * /api/users/verify:
 *   post:
 *     summary: Verify Firebase authentication token
 *     description: Verifies the provided Firebase ID token and returns user information extracted from the token
 *     tags: [Authentication]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 tokenValid:
 *                                   type: boolean
 *                                   example: true
 *                                 emailVerified:
 *                                   type: boolean
 *                                   example: true
 *             example:
 *               success: true
 *               message: "Token verified successfully"
 *               data:
 *                 user:
 *                   uid: "firebase_user_123"
 *                   email: "john.doe@example.com"
 *                   name: "John Doe"
 *                   picture: "https://example.com/profile.jpg"
 *                   emailVerified: true
 *                   tokenValid: true
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_user_data:
 *                 summary: No user data found
 *                 value:
 *                   success: false
 *                   message: "No user data found. Token may be invalid or missing."
 *                   error: "UNAUTHORIZED"
 *               invalid_token:
 *                 summary: Invalid token
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired Firebase token"
 *                   error: "TOKEN_INVALID"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

