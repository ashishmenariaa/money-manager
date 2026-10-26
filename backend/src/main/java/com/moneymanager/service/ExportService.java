package com.moneymanager.service;

import com.moneymanager.model.Transaction;
import com.moneymanager.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public String exportTransactionsToCsv(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository
            .findByUserIdAndTransactionDateBetween(userId, startDate, endDate);

        StringWriter writer = new StringWriter();
        writer.write("ID,Date,Type,Category,Amount,Description,Notes\n");

        for (Transaction t : transactions) {
            writer.write(String.format("%d,%s,%s,%s,%.2f,\"%s\",\"%s\"\n",
                t.getId(),
                t.getTransactionDate(),
                t.getType(),
                t.getCategory().getName(),
                t.getAmount(),
                t.getDescription() != null ? t.getDescription().replace("\"", "\"\"") : "",
                t.getNotes() != null ? t.getNotes().replace("\"", "\"\"") : ""
            ));
        }

        return writer.toString();
    }
}
