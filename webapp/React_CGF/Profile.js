const Profile = () => {
    const [user, setUser] = React.useState(null);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return unsubscribe;
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            setMessage('Logged out successfully');
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (!user) {
        return React.createElement('div', {style: {maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc'}},
            React.createElement('h2', null, 'User Profile'),
            React.createElement('p', null, 'You are not logged in. Please log in to view your profile.'),
            message && React.createElement('p', {style: {color: 'green'}}, message)
        );
    }

    return React.createElement('div', {style: {maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc'}},
        React.createElement('h2', null, 'User Profile'),
        React.createElement('p', null, `Email: ${user.email}`),
        React.createElement('p', null, `UID: ${user.uid}`),
        React.createElement('button', {onClick: handleLogout}, 'Log Out'),
        message && React.createElement('p', {style: {color: 'green'}}, message)
    );
};
