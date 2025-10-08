

export const verifyUserEmail = (username: String, verificationCode: Number) => `<!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmation d'inscription - Flajoo</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; padding: 20px;">
                    <img src="cid:logoflajoo" alt="Logo Flajoo" style="max-width: 150px;">
                </div>
                <div style="padding: 20px;">
                    <h2 style="text-align: center; color: #333;">Bienvenue sur Flajoo, ${username} !</h2>
                    <p style="text-align: justify; color: #555;">Nous sommes ravis de vous compter parmi nous sur Flajoo, votre nouveau réseau social de confiance.</p>
                    <p style="text-align: justify; color: #555;">Pour finaliser votre inscription, veuillez entrer le code de vérification à 6 chiffres ci-dessous :</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <h3 style="font-size: 24px; color: #007bff; margin-bottom: 10px;">${verificationCode}</h3>
                        <p style="font-size: 14px; color: #888;">Ce code est valable pendant 10 minutes.</p>
                    </div>
                    <p style="text-align: justify; color: #555;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                    <p style="text-align: left; font-size: 14px; color: #555;">Cordialement,<br><br>L'équipe Flajoo</p>
                </div>
                <div style="padding: 20px; background-color: #f1f1f1; border-top: 1px solid #e0e0e0;">
                    <p style="text-align: left; font-size: 12px; color: #555;">30-32 Avenue de la République<br>Villejuif, Val-de-Marne<br>Île-de-France, France</p>
                    <ul style="list-style-type: none; padding-left: 0; font-size: 12px; color: #555;">
                        <li>Tel : + 33 6 05 57 28 02</li>
                        <li>Email : <a href="mailto:contact@flajoo.com" style="color: #007bff; text-decoration: none;">contact@flajoo.com</a></li>
                    </ul>
                </div>
            </div>
        
        </body>
        </html>`