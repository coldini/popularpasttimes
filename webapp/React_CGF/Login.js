const Login = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            setMessage('Login successful!');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return React.createElement('div', {style: {maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc'}},
        React.createElement('h2', null, 'Log In'),
        React.createElement('form', {onSubmit: handleLogin},
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Email: '),
                React.createElement('input', {
                    type: 'email',
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    required: true
                })
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Password: '),
                React.createElement('input', {
                    type: 'password',
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    required: true
                })
            ),
            React.createElement('button', {type: 'submit', disabled: loading},
                loading ? 'Logging in...' : 'Log In'
            )
        ),
        message && React.createElement('p', {style: {color: message.includes('successful') ? 'green' : 'red'}}, message)
    );
};
