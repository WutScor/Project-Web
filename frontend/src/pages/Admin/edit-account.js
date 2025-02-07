import React from "react";
import { useLocation } from "react-router-dom";
import AccountForm from "../../components/Admin/accounts/account-form";

const EditAccount = () => {
    const location = useLocation();
    const { user, users } = location.state || {};

    return (
        <div>
            <h2 style={{ fontWeight: "bold" }}>Edit Account</h2>
            {user ? <AccountForm user={user} users={users} /> : <div>Loading...</div>}
        </div>
    );
};

export default EditAccount;