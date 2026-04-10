const Register = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            setMessage('Registration successful! You can now log in.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return React.createElement('div', {style: {maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc'}},
        React.createElement('h2', null, 'Register'),
        React.createElement('form', {onSubmit: handleRegister},
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
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Confirm Password: '),
                React.createElement('input', {
                    type: 'password',
                    value: confirmPassword,
                    onChange: (e) => setConfirmPassword(e.target.value),
                    required: true
                })
            ),
            React.createElement('button', {type: 'submit', disabled: loading},
                loading ? 'Registering...' : 'Register'
            )
        ),
        message && React.createElement('p', {style: {color: message.includes('successful') ? 'green' : 'red'}}, message)
    );
};
