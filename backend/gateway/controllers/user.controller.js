export const getCurrentUser = async (req, res) => {
    try {
        const user = {
            ...req.user,
            _id: req.user._id || req.user.userId
        };
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `get current user error ${error}` });
    }
};