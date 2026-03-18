const form = document.getElementById('loginForm');
const feedback = document.getElementById('feedback');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

function setFeedback(type, message) {
  feedback.className = `feedback ${type}`;
  feedback.textContent = message;
}

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('.submit-button');
  const payload = {
    email: form.email.value,
    password: form.password.value
  };

  submitButton.disabled = true;
  submitButton.textContent = 'Validando...';
  setFeedback('', '');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setFeedback('error', result.message || 'No fue posible iniciar sesión.');
      return;
    }

    setFeedback('success', `${result.message} Bienvenido, ${result.user.name}.`);
    form.reset();
  } catch (error) {
    setFeedback('error', 'Error de red. Intenta nuevamente en unos segundos.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Iniciar sesión';
  }
});
