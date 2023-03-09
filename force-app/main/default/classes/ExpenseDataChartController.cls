public with sharing class ExpenseDataChartController {

    @AuraEnabled
    public static Id saveChartImage(String base64Image, Date startDate, Date endDate) {
        ContentVersion cv = new ContentVersion();
        String content = base64Image.substring(base64Image.indexOf(',')+1,base64Image.length()).replace('\r\n', '').replace(' ','').replaceAll( '\\s+', '').replaceAll( '\\n+', '');

        cv.VersionData = EncodingUtil.base64Decode(content);
        String chartTitle = 'Expenses-' + formatDate(startDate) + '-' + formatDate(endDate);
        cv.Title = chartTitle+'image.png';
        cv.PathOnClient = cv.Title;
        cv.IsMajorVersion = false;
        insert cv;

        Id contentDocumentId = [SELECT ContentDocumentId, FileExtension, Title 
                FROM ContentVersion WHERE Id =: cv.Id].ContentDocumentId;
        return contentDocumentId;
    }

    static String formatDate(Date d) {
        return String.valueOf(d.year()) + '_' + String.valueOf(d.month()) + '_' + String.valueOf(d.day());
    }

}