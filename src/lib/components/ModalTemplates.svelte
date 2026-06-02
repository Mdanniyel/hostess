<div id="modal-dialog-templates">
	<div class="modal-dialog" data-template="modal-content">
		<div class="modal-content"></div>
	</div>
	<div class="modal-dialog" data-template="modal-loading">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">בטעינה...</h5>
				<button name="button" type="button" class="close" data-dismiss="modal"
					><span>×</span>
				</button>
			</div>
			<div class="modal-body">
				<div class="spinner-border"></div>
				<div class="far fa-check-circle"></div>
			</div>
		</div>
	</div>
	<div class="modal-dialog" data-template="modal-error">
		<div class="modal-content">
			<div class="modal-body">
				<button name="button" type="button" class="close" data-dismiss="modal"
					><span>×</span>
				</button>
				<div class="big-icon-danger">
					<div class="icon">
						<div class="icon-x">
							<div class="icon-left"></div>
							<div class="icon-right"></div>
						</div>
						<div class="icon-placeholder"></div>
						<div class="icon-fix"></div>
					</div>
				</div>
				<h5
					class="modal-title"
					data-default="אירעה שגיאה"
					data-offline="אין חיבור לאינטרנט"
					data-timeout="לא התקבלה תשובה"
					data-unauthenticated="אינך מחובר/ת למערכת"
				></h5>
				<div
					class="error-message"
					data-default="אירעה שגיאה בביצוע פעולה"
					data-offline="עושה רושם שישנה בעיה בחיבור האינטרנט, אנא נסו שנית"
					data-timeout="עבר זמן רב בנסיון טעינת המידע, אנא נסו שנית"
					data-unauthenticated="נא להתחבר מחדש ואז לחזור לטאב זה כדי לנסות שוב"
				>
					<div class="placeholder"></div>
					<hr />
					<a
						class="btn btn-light d-none sign-in-link"
						target="_blank"
						href="/he-IL/corp/mobile/accounts/sign_in">התחברות</a
					>
					<button name="button" type="button" class="btn btn-link" data-revert="modal"
						>נסה/י בשנית</button
					>
				</div>
			</div>
		</div>
	</div>
</div>

<div id="system-toasts"></div>
